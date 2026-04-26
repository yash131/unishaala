import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase, getCollection } from '@/lib/db';
import { createToken, verifyToken, hashPassword, verifyPassword, generateOTP, getUserFromToken } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

// CORS headers for payment gateway callbacks
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Max-Age': '86400',
};

// Helper function to create response
function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

// Helper function to create response with CORS headers
function corsJsonResponse(data, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

// Helper to get auth user
async function getAuthUser(request) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  return await getUserFromToken(token);
}

// Parse the path from the URL
function getPath(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace('/api', '') || '/';
  return pathname;
}

// ============ RANK PREDICTOR HELPERS ============

// Normalize question ID to lowercase without "q" prefix, e.g. "Q1" -> "1", "1" -> "1"
function normalizeQid(q) {
  if (q === null || q === undefined) return '';
  return String(q).trim().toUpperCase().replace(/^Q\.?\s*/i, '').replace(/\s+/g, '');
}

// Normalize answer: numeric "1"-"4" -> "A"-"D"; "a"-"d" -> uppercase; keep text unchanged for NAT
function normalizeAnswer(a) {
  if (a === null || a === undefined) return '';
  let v = String(a).trim();
  if (!v || v === '--' || v === '-' || v.toLowerCase() === 'not attempted' || v.toLowerCase() === 'no answer' || v.toLowerCase() === 'null') return '';
  // Numeric single digit 1-8 -> A-H
  if (/^[1-8]$/.test(v)) return String.fromCharCode(64 + parseInt(v));
  // "Option X" or "Option 1"
  const m = v.match(/^(?:option\s*)?([a-hA-H1-8])$/);
  if (m) {
    const ch = m[1];
    if (/[1-8]/.test(ch)) return String.fromCharCode(64 + parseInt(ch));
    return ch.toUpperCase();
  }
  // For MSQ multi-select "1,3" -> "A,C"
  if (/^[1-8](,\s*[1-8])+$/.test(v)) {
    return v.split(',').map(n => String.fromCharCode(64 + parseInt(n.trim()))).join(',');
  }
  // NAT or full text -> return as-is (trimmed, uppercased if pure letters)
  if (/^[A-H](,[A-H])+$/i.test(v)) return v.toUpperCase();
  if (/^[A-H]$/i.test(v)) return v.toUpperCase();
  // Assume it's a NAT numeric answer — keep as-is
  return v;
}

// Parse response sheet HTML and extract per-question details.
// Works on HTML table structure directly (label <td> → value <td> pairs).
function parseResponseSheetHTML(html) {
  const result = { byId: {}, byIndex: {}, errorPage: false, totalFound: 0 };
  if (!html || typeof html !== 'string') return result;

  let h = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');

  // Detect TCS iON error page
  if (/<title>\s*Error Page\s*<\/title>/i.test(h) ||
      /Something went wrong\s*\.?\s*We&#39;re Sorry/i.test(h) ||
      /We&rsquo;re Sorry for the Inconvenience/i.test(h) ||
      /support@tcsion\.com/i.test(h)) {
    if (!/Question\s*ID\s*:/i.test(h) && !/Chosen\s*Option\s*:/i.test(h)) {
      result.errorPage = true;
      return result;
    }
  }

  // Helper: strip tags and zero-width chars from a fragment
  const stripTags = (s) => String(s || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/[\u200B-\u200F\uFEFF]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // ---------- PRIMARY: TCS iON HTML table structure ----------
  // Extract all <td>...</td> cells in document order, pair them as (label, value).
  // TCS iON always has "Label :" in one td and the value in the NEXT td.
  const tdIter = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const tds = [];
  let tm;
  while ((tm = tdIter.exec(h)) !== null) {
    tds.push(stripTags(tm[1]));
  }

  if (tds.length > 0) {
    // Walk through cells. Note: TCS iON layout quirk —
    //   * For MCQ/MSQ: Chosen Option appears AFTER Question ID (same block)
    //   * For NAT:     Given Answer appears BEFORE Question ID (left-side row)
    // We buffer Given Answer and apply it to the NEXT question block.
    let currentQid = null;
    let currentType = '';
    let currentStatus = '';
    let currentChosen = '';
    let currentGiven = '';
    let pendingGiven = ''; // Given Answer seen before the next Question ID
    let idx = 0;

    const flushCurrent = () => {
      if (!currentQid) return;
      idx += 1;
      let answer = '';
      let effType = currentType;

      // Prefer Given Answer (NAT) over Chosen Option when both present
      if (currentGiven && !/^-+$/.test(currentGiven.trim())) {
        answer = currentGiven.trim();
        if (!effType) effType = 'NAT';
      } else if (currentChosen && !/^-+$/.test(currentChosen.trim())) {
        const raw = currentChosen.trim();
        const isMulti = /[,;|]/.test(raw);
        if (isMulti) {
          answer = raw.split(/[,;|]/).map(x => normalizeAnswer(x.trim())).filter(Boolean).sort().join(',');
          if (!effType) effType = 'MSQ';
        } else {
          answer = normalizeAnswer(raw);
          if (!effType) effType = 'MCQ';
        }
      }

      if (currentStatus === 'Not Answered') answer = '';

      const entry = {
        type: effType || '',
        status: currentStatus || (answer ? 'Answered' : 'Not Answered'),
        answer
      };
      result.byId[currentQid] = entry;
      result.byIndex[String(idx)] = entry;
      result.totalFound++;
    };

    for (let i = 0; i < tds.length - 1; i++) {
      const label = tds[i];
      const value = tds[i + 1] || '';
      const labelLower = label.toLowerCase().replace(/\s*:\s*$/, '').trim();

      if (labelLower === 'question id' || /^question\s*id$/i.test(labelLower)) {
        // flush previous question, start new
        flushCurrent();
        currentQid = String(value).replace(/[^0-9A-Za-z]/g, '');
        currentType = '';
        currentStatus = '';
        currentChosen = '';
        // Apply any Given Answer that appeared BEFORE this Question ID (NAT layout)
        currentGiven = pendingGiven || '';
        pendingGiven = '';
      } else if (/^question\s*type$/i.test(labelLower)) {
        const t = String(value).trim().toUpperCase();
        if (t === 'MCQ' || t === 'MSQ' || t === 'NAT' || t === 'SA') currentType = t === 'SA' ? 'NAT' : t;
      } else if (labelLower === 'status') {
        const s = String(value).trim();
        if (/not\s*answered/i.test(s) || /not\s*attempted/i.test(s)) currentStatus = 'Not Answered';
        else if (/answered/i.test(s)) currentStatus = 'Answered';
      } else if (/^chosen\s*option$/i.test(labelLower)) {
        // Always post-Question-ID
        currentChosen = String(value).trim();
      } else if (/^given\s*answer$/i.test(labelLower)) {
        // NAT: Given Answer may appear BEFORE Question ID. Buffer until a Question ID is seen.
        if (!currentQid) {
          pendingGiven = String(value).trim();
        } else {
          // If we already have a Question ID set (layout variant), apply directly.
          // But for TCS iON, this usually means the Given Answer is for the NEXT question
          // whose Question ID hasn't been reached yet — buffer it.
          pendingGiven = String(value).trim();
        }
      }
    }
    // flush the last one
    flushCurrent();

    if (result.totalFound > 0) return result;
  }

  // ---------- FALLBACK: regex on stripped text (for non-tabular formats) ----------
  const textPlain = h.replace(/&nbsp;/g, ' ').replace(/[\u200B-\u200F\uFEFF]/g, '').replace(/\s+/g, ' ');
  const text = textPlain.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  // Label-based: "Q.No: 1 ... Chosen Option: A"
  const qnoIter = /(?:Question\s*(?:Number|No\.?)|Q\.?\s*No\.?)\s*[:\-]?\s*([0-9]+)/gi;
  const qMatches = [];
  let mm;
  while ((mm = qnoIter.exec(text)) !== null) {
    qMatches.push({ qnum: String(mm[1]), start: mm.index, end: mm.index + mm[0].length });
  }
  if (qMatches.length > 0) {
    for (let i = 0; i < qMatches.length; i++) {
      const cur = qMatches[i];
      const next = qMatches[i + 1];
      const segment = text.slice(cur.end, next ? next.start : text.length);
      const coMatch = segment.match(/(?:Chosen\s*Option|Selected\s*Option|Chosen\s*Answer|Your\s*Answer|Response|Answer)\s*[:\-]\s*([A-Za-z0-9,\-\s\.]+?)(?=\s*(?:Question|Q\.?\s*No|Status|Section|$))/i);
      if (coMatch) {
        const raw = coMatch[1].trim();
        let answer = '';
        let type = '';
        if (raw && !/^-+$/.test(raw)) {
          if (/,/.test(raw) && /^[A-H](,[A-H])+$/i.test(raw)) {
            answer = raw.toUpperCase().split(',').map(x => x.trim()).sort().join(',');
            type = 'MSQ';
          } else if (/^-?\d+(\.\d+)?$/.test(raw)) {
            answer = raw; type = 'NAT';
          } else {
            answer = normalizeAnswer(raw); type = 'MCQ';
          }
        }
        const entry = { type, status: answer ? 'Answered' : 'Not Answered', answer };
        result.byIndex[cur.qnum] = entry;
        result.totalFound++;
      }
    }
  }

  return result;
}

// Parse simple user-typed answers like "1:A, 2:B,D; 3:16.5; 4:--"
// Returns same shape as parseResponseSheetHTML.
function parseSimpleAnswers(text) {
  const result = { byId: {}, byIndex: {}, errorPage: false, totalFound: 0 };
  if (!text || typeof text !== 'string') return result;
  const parts = text.split(/[\n;]+/);
  for (const p of parts) {
    // split on first ":" or "=" only, so MSQ answers like A,B aren't split
    const m = p.match(/^\s*Q?\.?\s*([A-Za-z0-9]+)\s*[:=]\s*(.*?)\s*$/i);
    if (m) {
      const raw = m[1];
      const rawAns = m[2].trim();
      let answer = '';
      let type = '';
      if (rawAns && !/^-+$/.test(rawAns)) {
        if (/,/.test(rawAns)) {
          // MSQ
          answer = rawAns.split(',').map(x => normalizeAnswer(x.trim())).filter(Boolean).sort().join(',');
          type = 'MSQ';
        } else if (/^-?\d+(\.\d+)?$/.test(rawAns)) {
          answer = rawAns;
          type = 'NAT';
        } else {
          answer = normalizeAnswer(rawAns);
          type = 'MCQ';
        }
      }
      const entry = { type, status: answer ? 'Answered' : 'Not Answered', answer };
      if (/^[0-9]+$/.test(raw)) {
        result.byIndex[raw] = entry;
      } else {
        result.byId[raw] = entry;
      }
      result.totalFound++;
    }
  }
  return result;
}

// Classify the correct answer from CSV to determine question type.
function classifyCorrect(correctRaw) {
  const c = String(correctRaw || '').trim();
  if (!c) return { type: 'UNKNOWN', value: '' };
  const upper = c.toUpperCase();
  if (upper === 'MAT' || upper === 'BONUS') return { type: 'MAT', value: 'MAT' };
  // Range: "16.5-16.8" or "16.5 to 16.8" (but not "-1" negative number)
  const rangeMatch = c.replace(/\s+/g, '').match(/^(-?\d+(?:\.\d+)?)(?:-|–|to)(-?\d+(?:\.\d+)?)$/i);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1]);
    const hi = parseFloat(rangeMatch[2]);
    if (!Number.isNaN(lo) && !Number.isNaN(hi)) {
      return { type: 'RANGE', value: [Math.min(lo, hi), Math.max(lo, hi)] };
    }
  }
  // MSQ: letters separated by commas/pipes/semicolons
  if (/[,|;]/.test(c) && /^[A-H](?:\s*[,|;]\s*[A-H])+$/i.test(c)) {
    const letters = c.toUpperCase().split(/[,|;]/).map(s => s.trim()).filter(Boolean).sort();
    return { type: 'MSQ', value: letters.join(',') };
  }
  // NAT: pure numeric
  if (/^-?\d+(\.\d+)?$/.test(c)) {
    return { type: 'NAT', value: parseFloat(c) };
  }
  // MCQ: single letter
  if (/^[A-H]$/i.test(c)) {
    return { type: 'MCQ', value: c.toUpperCase() };
  }
  // Normalized fallback - treat as MCQ
  return { type: 'MCQ', value: normalizeAnswer(c) };
}

// Evaluate extracted answers against the answer key with advanced answer type support.
// Match strategy (question-ID driven, per user requirement):
//   1. Exact match on raw question_id vs extracted byId
//   2. Trimmed/normalized match on question_id
//   3. For short numeric CSV IDs only (like "1","2","3" or "Q1"), allow byIndex positional match
//   4. Otherwise — no match → unattempted
function evaluateAnswers(extracted, answerKey, positiveMarks, negativeMarks) {
  const pos = Number(positiveMarks) || 0;
  const neg = Number(negativeMarks) || 0;
  let correct = 0, wrong = 0, unattempted = 0, marks = 0;
  const details = [];
  const unmatchedIds = [];

  const byId = extracted?.byId || {};
  const byIndex = extracted?.byIndex || {};
  const keyAnswers = answerKey.answers || [];

  // Normalize byId keys (trim, strip zero-width chars)
  const byIdNorm = {};
  for (const [k, v] of Object.entries(byId)) {
    const nk = String(k).replace(/[\u200B-\u200F\uFEFF\s]+/g, '');
    byIdNorm[nk] = v;
  }

  for (let i = 0; i < keyAnswers.length; i++) {
    const item = keyAnswers[i];
    const rawCorrect = item.correct_answer;
    const classified = classifyCorrect(rawCorrect);
    const qidRaw = String(item.question_id);
    const qidClean = qidRaw.replace(/[\u200B-\u200F\uFEFF\s]+/g, '');
    const qidNorm = normalizeQid(qidRaw);

    // Detect if CSV is using long internal IDs (≥ 4 digits, pure numeric)
    const isLongId = /^[0-9]{4,}$/.test(qidClean) || /^[0-9]{4,}$/.test(qidNorm);

    // Lookup order: raw id → cleaned id → normalized id → index (only for short IDs)
    let entry = undefined;
    let matchedBy = 'none';

    if (byId[qidRaw] !== undefined) { entry = byId[qidRaw]; matchedBy = 'id-exact'; }
    else if (byIdNorm[qidClean] !== undefined) { entry = byIdNorm[qidClean]; matchedBy = 'id-normalized'; }
    else if (byId[qidNorm] !== undefined) { entry = byId[qidNorm]; matchedBy = 'id-stripped'; }
    else if (!isLongId) {
      // Short sequential IDs — allow positional fallback
      if (byIndex[qidNorm] !== undefined) { entry = byIndex[qidNorm]; matchedBy = 'index-explicit'; }
      else if (byIndex[String(i + 1)] !== undefined) { entry = byIndex[String(i + 1)]; matchedBy = 'index-position'; }
    }

    if (!entry && isLongId) {
      unmatchedIds.push(qidRaw);
    }

    const userAnswer = entry?.answer ?? '';
    const userStatus = entry?.status ?? '';

    let status;

    // MAT/Bonus: credit ONLY if user provided a non-empty answer
    if (classified.type === 'MAT') {
      const hasAnswer = userAnswer && String(userAnswer).trim() !== '';
      if (hasAnswer) {
        correct++; marks += pos; status = 'correct';
      } else {
        unattempted++; status = 'unattempted';
      }
    }
    else if (!userAnswer || String(userAnswer).trim() === '' || userStatus === 'Not Answered') {
      unattempted++; status = 'unattempted';
    }
    else if (classified.type === 'NAT') {
      const u = parseFloat(userAnswer);
      if (Number.isNaN(u)) { wrong++; marks -= neg; status = 'wrong'; }
      else if (Math.abs(u - classified.value) <= 0.01) { correct++; marks += pos; status = 'correct'; }
      else { wrong++; marks -= neg; status = 'wrong'; }
    }
    else if (classified.type === 'RANGE') {
      const u = parseFloat(userAnswer);
      if (Number.isNaN(u)) { wrong++; marks -= neg; status = 'wrong'; }
      else if (u >= classified.value[0] && u <= classified.value[1]) { correct++; marks += pos; status = 'correct'; }
      else { wrong++; marks -= neg; status = 'wrong'; }
    }
    else if (classified.type === 'MSQ') {
      let uStr = String(userAnswer).toUpperCase();
      if (/^[0-9](,[0-9])+$/.test(uStr)) {
        uStr = uStr.split(',').map(n => String.fromCharCode(64 + parseInt(n.trim()))).sort().join(',');
      } else {
        uStr = uStr.split(/[,|;]/).map(s => s.trim()).filter(Boolean).sort().join(',');
      }
      if (uStr === classified.value) { correct++; marks += pos; status = 'correct'; }
      else { wrong++; marks -= neg; status = 'wrong'; }
    }
    else {
      if (String(userAnswer).toUpperCase() === String(classified.value).toUpperCase()) {
        correct++; marks += pos; status = 'correct';
      } else {
        wrong++; marks -= neg; status = 'wrong';
      }
    }

    details.push({
      question_id: item.question_id,
      type: classified.type,
      correct_answer: String(rawCorrect),
      user_answer: userAnswer || null,
      matched_by: matchedBy,
      status
    });
  }

  const totalQuestions = keyAnswers.length;
  const attempted = correct + wrong;
  const maxMarks = +(totalQuestions * pos).toFixed(2);
  marks = +marks.toFixed(2);
  return { correct, wrong, unattempted, attempted, marks, totalQuestions, maxMarks, details, unmatchedIds };
}




// Helper function to check ICICI transaction status via Command API
async function checkICICITransactionStatus(merchantTxnNo) {
  try {
    const crypto = require('crypto');
    const merchantId = process.env.ICICI_MID;
    const aggregatorID = process.env.ICICI_AGG_ID;
    const transactionType = 'STATUS';
    
    // Generate hash for status check
    // Order: aggregatorID + merchantId + merchantTxnNo + transactionType
    const hashText = aggregatorID + merchantId + merchantTxnNo + transactionType;
    const secureHash = crypto.createHmac('sha256', process.env.ICICI_KEY)
      .update(hashText, 'utf8')
      .digest('hex');

    console.log('ICICI Status Check Request:', {
      merchantId,
      aggregatorID,
      merchantTxnNo,
      transactionType,
      hashText,
      secureHash
    });

    const response = await fetch(process.env.ICICI_COMMAND_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId,
        aggregatorID,
        merchantTxnNo,
        transactionType,
        secureHash
      })
    });

    // First get the raw text response
    const rawText = await response.text();
    console.log('ICICI Status Raw Response:', rawText);
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(rawText);
    } catch (parseError) {
      console.log('ICICI returned non-JSON response:', rawText);
      // Return error if not JSON
      return { status: 'ERROR', payload: { rawResponse: rawText, error: 'Non-JSON response from ICICI' } };
    }
    
    console.log('ICICI Status Check Result:', result);

    if (result.responseCode === '0000' || result.txnStatus === 'SUC') {
      return { status: 'SUCCESS', payload: result };
    } else if (result.txnStatus === 'FAL' || (result.responseCode && result.responseCode !== '0000')) {
      return { status: 'FAILED', payload: result };
    }
    return { status: 'PENDING', payload: result };
  } catch (error) {
    console.error('Error checking ICICI status:', error);
    return { status: 'ERROR', payload: { error: error.message } };
  }
}

// GET Requests Handler
export async function GET(request) {
  const path = getPath(request);
  const { searchParams } = new URL(request.url);

  try {
    await connectToDatabase();

    // Current authenticated user — useful for client-side gating (phone verification, PDF access, etc.)
    if (path === '/auth/me') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Not authenticated' }, 401);
      }
      const { password, otp, otpExpiry, ...safeUser } = user;
      return jsonResponse({ success: true, data: safeUser });
    }

    // Home page data
    if (path === '/home' || path === '/') {
      await seedDatabase();
      const exams = await getCollection('exams');
      const notifications = await getCollection('exam_notifications');
      const testimonials = await getCollection('testimonials');
      const jobs = await getCollection('jobs');
      const colleges = await getCollection('colleges');
      const blogs = await getCollection('blogs');

      return jsonResponse({
        success: true,
        data: {
          exams: await exams.find({ status: 'Active' }).toArray(),
          notifications: await notifications.find({}).sort({ createdAt: -1 }).limit(4).toArray(),
          testimonials: await testimonials.find({}).limit(3).toArray(),
          jobs: await jobs.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(3).toArray(),
          colleges: await colleges.find({}).sort({ ranking: 1 }).limit(4).toArray(),
          blogs: await blogs.find({
            status: 'published',
            publishDate: { $lte: new Date() }
          }).project({ id: 1, title: 1, slug: 1, description: 1, image: 1, publishDate: 1, views: 1 })
            .sort({ publishDate: -1 }).limit(8).toArray()
        }
      });
    }

    // All Exams
    if (path === '/exams') {
      const exams = await getCollection('exams');
      const category = searchParams.get('category');
      const query = category ? { status: 'Active', category } : { status: 'Active' };
      return jsonResponse({
        success: true,
        data: await exams.find(query).toArray()
      });
    }

    // Public - Get all published blogs
    if (path === '/blogs') {
      const blogs = await getCollection('blogs');
      const publishedBlogs = await blogs.find({ 
        status: 'published',
        publishDate: { $lte: new Date() }
      }).sort({ publishDate: -1 }).toArray();
      return jsonResponse({ success: true, data: publishedBlogs });
    }

    // Public - Get active answer keys (for user rank predictor)
    if (path === '/answer-keys') {
      const keys = await getCollection('answer_keys');
      const all = await keys.find({ status: { $ne: 'inactive' } })
        .project({ id: 1, title: 1, description: 1, examId: 1, positiveMarks: 1, negativeMarks: 1, totalQuestions: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .toArray();
      return jsonResponse({ success: true, data: all });
    }

    // Public - Sample CSV download for answer key
    if (path === '/rank-predictor/sample-csv') {
      const csv = 'question_id,correct_answer\n6420084710,C\n6420084720,A\n"6420084732","B,D"\n6420084736,16.5-16.8\n6420084740,12.5\n6420084750,MAT\n';
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="answer-key-sample.csv"',
        },
      });
    }

    // Public - Get single blog by slug
    if (path.startsWith('/blogs/')) {
      const slug = path.split('/blogs/')[1];
      const blogs = await getCollection('blogs');
      const blog = await blogs.findOne({ slug, status: 'published' });
      if (!blog) {
        return jsonResponse({ success: false, error: 'Blog not found' }, 404);
      }
      // Increment view count
      await blogs.updateOne({ id: blog.id }, { $inc: { views: 1 } });
      return jsonResponse({ success: true, data: blog });
    }

    // Single Exam by slug - return domains for this exam
    if (path.startsWith('/exams/')) {
      const slug = path.split('/exams/')[1];
      const exams = await getCollection('exams');
      const exam = await exams.findOne({ slug });
      
      if (!exam) {
        return jsonResponse({ success: false, error: 'Exam not found' }, 404);
      }

      // Get domains for this exam
      const domainsCollection = await getCollection('domains');
      const domains = await domainsCollection.find({ 
        examId: exam.id, 
        status: 'Active' 
      }).toArray();

      // Get test counts for each domain
      const mockTests = await getCollection('mock_tests');
      const domainsWithCounts = await Promise.all(domains.map(async (domain) => {
        const testCount = await mockTests.countDocuments({ 
          domainId: domain.id, 
          isPublished: true, 
          status: 'Active' 
        });
        return { ...domain, testCount };
      }));

      return jsonResponse({
        success: true,
        data: {
          exam,
          domains: domainsWithCounts
        }
      });
    }

    // Get tests for a specific domain
    if (path.startsWith('/domains/') && !path.includes('/admin')) {
      const domainId = path.split('/domains/')[1];
      const domainsCollection = await getCollection('domains');
      const domain = await domainsCollection.findOne({ id: domainId });
      
      if (!domain) {
        return jsonResponse({ success: false, error: 'Domain not found' }, 404);
      }

      const exams = await getCollection('exams');
      const exam = await exams.findOne({ id: domain.examId });

      const mockTests = await getCollection('mock_tests');
      const questions = await getCollection('questions');

      // Get tests for this domain
      const domainTests = await mockTests.find({
        domainId: domain.id,
        isPublished: true,
        status: 'Active'
      }).toArray();

      // Add question count to each test
      const testsWithCount = await Promise.all(domainTests.map(async (test) => {
        const qCount = await questions.countDocuments({ 
          mockTestId: test.id, 
          $or: [
            { status: 'Active' },
            { status: 'active' },
            { status: { $exists: false } }
          ]
        });
        return { ...test, questionCount: qCount };
      }));

      // Only return tests that have questions
      const finalTests = testsWithCount.filter(t => t.questionCount > 0);

      return jsonResponse({
        success: true,
        data: {
          domain,
          exam,
          tests: finalTests
        }
      });
    }

    // Leaderboard for an exam - PUBLIC endpoint
    if (path.startsWith('/leaderboard/')) {
      const slug = path.split('/leaderboard/')[1];
      const exams = await getCollection('exams');
      const exam = await exams.findOne({ slug });
      
      if (!exam) {
        return jsonResponse({ success: false, error: 'Exam not found' }, 404);
      }

      const mockTests = await getCollection('mock_tests');
      const attempts = await getCollection('test_attempts');
      const users = await getCollection('users');

      // Get all mock test IDs for this exam
      const examMockTests = await mockTests.find({ examId: exam.id }).toArray();
      const mockTestIds = examMockTests.map(t => t.id);

      if (mockTestIds.length === 0) {
        return jsonResponse({
          success: true,
          data: {
            exam: { name: exam.name, slug: exam.slug, icon: exam.icon },
            leaderboard: [],
            totalParticipants: 0
          }
        });
      }

      // Aggregate: Get best score per user across all tests in this exam
      const pipeline = [
        // Match completed attempts for this exam's tests
        {
          $match: {
            mockTestId: { $in: mockTestIds },
            status: 'COMPLETED'
          }
        },
        // Group by userId to get best score and stats
        {
          $group: {
            _id: '$userId',
            bestScore: { $max: '$score' },
            totalMarks: { $first: '$totalMarks' },
            attempts: { $sum: 1 },
            lastAttempt: { $max: '$endTime' },
            bestCorrect: { $max: '$correct' },
            bestIncorrect: { $min: '$incorrect' }
          }
        },
        // Sort by best score descending
        {
          $sort: { bestScore: -1, lastAttempt: 1 }
        },
        // Limit to top 100
        {
          $limit: 100
        }
      ];

      const leaderboardData = await attempts.aggregate(pipeline).toArray();

      // Get user details for each entry
      const userIds = leaderboardData.map(entry => entry._id);
      const userList = await users.find({ id: { $in: userIds } }).toArray();
      const userMap = {};
      userList.forEach(u => {
        userMap[u.id] = { name: u.name, email: u.email };
      });

      // Build final leaderboard with ranks
      const leaderboard = leaderboardData.map((entry, index) => {
        const user = userMap[entry._id] || { name: 'Anonymous' };
        const accuracy = entry.totalMarks > 0 
          ? Math.round((entry.bestScore / entry.totalMarks) * 100) 
          : 0;
        
        return {
          rank: index + 1,
          userId: entry._id,
          name: user.name,
          bestScore: Math.round(entry.bestScore * 100) / 100,
          totalMarks: entry.totalMarks,
          accuracy,
          attempts: entry.attempts,
          correct: entry.bestCorrect || 0,
          incorrect: entry.bestIncorrect || 0,
          lastAttempt: entry.lastAttempt
        };
      });

      // Get total unique participants
      const totalParticipants = await attempts.distinct('userId', {
        mockTestId: { $in: mockTestIds },
        status: 'COMPLETED'
      });

      return jsonResponse({
        success: true,
        data: {
          exam: { name: exam.name, slug: exam.slug, icon: exam.icon, fullName: exam.fullName },
          leaderboard,
          totalParticipants: totalParticipants.length
        }
      });
    }

    // Get user's rank for an exam
    if (path.startsWith('/my-rank/')) {
      const slug = path.split('/my-rank/')[1];
      const user = await getAuthUser(request);
      
      if (!user) {
        return jsonResponse({ success: false, error: 'Please login to see your rank' }, 401);
      }

      const exams = await getCollection('exams');
      const exam = await exams.findOne({ slug });
      
      if (!exam) {
        return jsonResponse({ success: false, error: 'Exam not found' }, 404);
      }

      const mockTests = await getCollection('mock_tests');
      const attempts = await getCollection('test_attempts');

      // Get all mock test IDs for this exam
      const examMockTests = await mockTests.find({ examId: exam.id }).toArray();
      const mockTestIds = examMockTests.map(t => t.id);

      if (mockTestIds.length === 0) {
        return jsonResponse({
          success: true,
          data: { rank: null, bestScore: 0, totalParticipants: 0 }
        });
      }

      // Get user's best score
      const userBest = await attempts.aggregate([
        {
          $match: {
            mockTestId: { $in: mockTestIds },
            userId: user.id,
            status: 'COMPLETED'
          }
        },
        {
          $group: {
            _id: '$userId',
            bestScore: { $max: '$score' },
            totalMarks: { $first: '$totalMarks' },
            attempts: { $sum: 1 }
          }
        }
      ]).toArray();

      if (userBest.length === 0) {
        return jsonResponse({
          success: true,
          data: { rank: null, bestScore: 0, totalParticipants: 0, message: 'No attempts yet' }
        });
      }

      const userScore = userBest[0].bestScore;

      // Count how many users have higher score
      const higherScores = await attempts.aggregate([
        {
          $match: {
            mockTestId: { $in: mockTestIds },
            status: 'COMPLETED'
          }
        },
        {
          $group: {
            _id: '$userId',
            bestScore: { $max: '$score' }
          }
        },
        {
          $match: {
            bestScore: { $gt: userScore }
          }
        },
        {
          $count: 'count'
        }
      ]).toArray();

      const rank = (higherScores[0]?.count || 0) + 1;

      // Get total participants
      const totalParticipants = await attempts.distinct('userId', {
        mockTestId: { $in: mockTestIds },
        status: 'COMPLETED'
      });

      return jsonResponse({
        success: true,
        data: {
          rank,
          bestScore: Math.round(userScore * 100) / 100,
          totalMarks: userBest[0].totalMarks,
          attempts: userBest[0].attempts,
          totalParticipants: totalParticipants.length,
          percentile: Math.round(((totalParticipants.length - rank) / totalParticipants.length) * 100)
        }
      });
    }

    // Get Mock Test by ID (for users - only published)
    if (path.startsWith('/mock-test/')) {
      const testId = path.split('/mock-test/')[1];
      const mockTests = await getCollection('mock_tests');
      const test = await mockTests.findOne({ id: testId });
      
      if (!test) {
        return jsonResponse({ success: false, error: 'Mock test not found' }, 404);
      }

      // Check if test is published for regular users
      const user = await getAuthUser(request);
      const isAdmin = user && ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(user.role);
      
      if (!isAdmin && !test.isPublished) {
        return jsonResponse({ success: false, error: 'Test not available' }, 404);
      }

      const res = NextResponse.json({ success: true, data: test });
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      return res;
    }

    // Get questions for a mock test (User taking test - only Active questions)
    if (path.startsWith('/mock-test-questions/')) {
      const testId = path.split('/mock-test-questions/')[1];
      const questions = await getCollection('questions');

      // Match docs that may carry test_id, mockTestId, or both. This handles
      // legacy data where only one field was set.
      const testQuestions = await questions.find({
        $and: [
          { $or: [{ mockTestId: testId }, { test_id: testId }] },
          {
            $or: [
              { status: 'Active' },
              { status: 'active' },
              { status: { $exists: false } }
            ]
          }
        ]
      }).sort({ question_number: 1 }).toArray();
      
      // Remove correct answers for test mode - handle both old and new format
      const questionsWithoutAnswers = testQuestions.map(q => {
        // Handle options - could be array of objects or separate fields
        let options;
        if (q.options && Array.isArray(q.options)) {
          // New format: options is array of {number, title, image_url}
          options = q.options.map(opt => opt?.title || opt?.text || opt || '');
        } else {
          // Old format: separate option1_title, option2_title fields
          options = [q.option1_title, q.option2_title, q.option3_title, q.option4_title];
        }
        
        // Handle question text - could be question_text or question_title
        const questionText = q.question_text || q.question_title || '';
        
        // Handle question image
        const questionImage = q.question_image_url || q.questionImageUrl || null;
        
        // Handle option images (new format)
        let optionImages = [null, null, null, null];
        if (q.options && Array.isArray(q.options)) {
          optionImages = q.options.map(opt => opt?.image_url || opt?.imageUrl || null);
        }
        
        return {
          id: q.id,
          questionNumber: q.question_number || q.questionNumber,
          question_title: questionText,
          questionText: questionText,
          question_image_url: questionImage,
          description: q.description,
          topic_title: q.topic_title,
          options: options,
          optionImages: optionImages,
          marks: q.marks || 2,
          duration: q.duration
        };
      });

      // Always return fresh data — admins frequently re-import question banks
      // and any cached response would mask updated image URLs.
      const noCacheRes = NextResponse.json({ success: true, data: questionsWithoutAnswers });
      noCacheRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      noCacheRes.headers.set('Pragma', 'no-cache');
      noCacheRes.headers.set('Expires', '0');
      return noCacheRes;
    }

    // Jobs list
    if (path === '/jobs') {
      const jobs = await getCollection('jobs');
      const category = searchParams.get('category');
      const query = category ? { status: 'Active', category } : { status: 'Active' };
      return jsonResponse({
        success: true,
        data: await jobs.find(query).sort({ createdAt: -1 }).toArray()
      });
    }

    // Single Job
    if (path.startsWith('/jobs/')) {
      const jobId = path.split('/jobs/')[1];
      const jobs = await getCollection('jobs');
      const job = await jobs.findOne({ id: jobId });
      
      if (!job) {
        return jsonResponse({ success: false, error: 'Job not found' }, 404);
      }
      return jsonResponse({ success: true, data: job });
    }

    // Colleges
    if (path === '/colleges') {
      const colleges = await getCollection('colleges');
      return jsonResponse({
        success: true,
        data: await colleges.find({}).sort({ ranking: 1 }).toArray()
      });
    }

    // Testimonials
    if (path === '/testimonials') {
      const testimonials = await getCollection('testimonials');
      return jsonResponse({
        success: true,
        data: await testimonials.find({}).toArray()
      });
    }

    // Notifications
    if (path === '/notifications') {
      const notifications = await getCollection('exam_notifications');
      return jsonResponse({
        success: true,
        data: await notifications.find({}).sort({ createdAt: -1 }).toArray()
      });
    }

    // User Profile
    if (path === '/profile') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }
      const { password, ...userData } = user;
      return jsonResponse({ success: true, data: userData });
    }

    // Get user's purchased tests/exams
    if (path === '/user/purchases') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Please login' }, 401);
      }

      const transactions = await getCollection('transactions');
      const purchases = await transactions.find({
        userId: user.id,
        status: 'SUCCESS'
      }).toArray();

      return jsonResponse({
        success: true,
        data: purchases.map(p => ({
          mockTestId: p.mockTestId,
          domainId: p.domainId,
          examId: p.examId,
          itemName: p.itemName,
          purchasedAt: p.completedAt || p.createdAt
        }))
      });
    }

    // Test attempt result with solutions
    if (path.startsWith('/attempt/')) {
      const attemptId = path.split('/attempt/')[1];
      const attempts = await getCollection('test_attempts');
      const attempt = await attempts.findOne({ id: attemptId });
      
      if (!attempt) {
        return jsonResponse({ success: false, error: 'Attempt not found' }, 404);
      }

      const questions = await getCollection('questions');
      const testQuestions = await questions.find({ mockTestId: attempt.mockTestId }).toArray();
      
      // Format questions with solutions for review
      const formattedQuestions = testQuestions.map(q => ({
        id: q.id,
        questionNumber: q.questionNumber,
        questionText: q.question_title,
        options: [q.option1_title, q.option2_title, q.option3_title, q.option4_title],
        correctOption: q.correct_option_number,
        solution: q.solution_text,
        topic: q.topic_title,
        marks: q.marks || 2
      }));

      return jsonResponse({
        success: true,
        data: { attempt, questions: formattedQuestions }
      });
    }

    // ======= ADMIN ROUTES =======
    if (path.startsWith('/admin')) {
      const user = await getAuthUser(request);
      if (!user || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(user.role)) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }

      // Admin Dashboard Stats
      if (path === '/admin/stats') {
        const users = await getCollection('users');
        const exams = await getCollection('exams');
        const mockTests = await getCollection('mock_tests');
        const questions = await getCollection('questions');
        const jobs = await getCollection('jobs');

        return jsonResponse({
          success: true,
          data: {
            totalUsers: await users.countDocuments(),
            totalExams: await exams.countDocuments(),
            totalMockTests: await mockTests.countDocuments(),
            totalQuestions: await questions.countDocuments(),
            totalJobs: await jobs.countDocuments(),
            totalRevenue: 0
          }
        });
      }

      // Admin - Get all users
      if (path === '/admin/users') {
        const users = await getCollection('users');
        return jsonResponse({ 
          success: true, 
          data: await users.find({}).project({ password: 0 }).toArray() 
        });
      }

      // Admin - Get all exams
      if (path === '/admin/exams') {
        const exams = await getCollection('exams');
        return jsonResponse({ success: true, data: await exams.find({}).toArray() });
      }

      // Admin - Get all domains
      if (path === '/admin/domains') {
        const examId = searchParams.get('examId');
        const domainsCollection = await getCollection('domains');
        const query = examId ? { examId } : {};
        const domains = await domainsCollection.find(query).sort({ createdAt: 1 }).toArray();
        return jsonResponse({ success: true, data: domains });
      }

      // Admin - Get all blog posts
      if (path === '/admin/blogs') {
        const blogs = await getCollection('blogs');
        const allBlogs = await blogs.find({}).sort({ createdAt: -1 }).toArray();
        return jsonResponse({ success: true, data: allBlogs });
      }

      // Admin - Get single blog post
      if (path.startsWith('/admin/blogs/')) {
        const blogId = path.split('/admin/blogs/')[1];
        const blogs = await getCollection('blogs');
        const blog = await blogs.findOne({ id: blogId });
        if (!blog) {
          return jsonResponse({ success: false, error: 'Blog not found' }, 404);
        }
        return jsonResponse({ success: true, data: blog });
      }

      // Admin - Get all mock tests (including unpublished)
      if (path === '/admin/mock-tests') {
        const mockTests = await getCollection('mock_tests');
        const questions = await getCollection('questions');
        
        const tests = await mockTests.find({}).toArray();
        
        // Add question count to each test
        const testsWithCount = await Promise.all(tests.map(async (test) => {
          const count = await questions.countDocuments({ mockTestId: test.id });
          return { ...test, questionCount: count };
        }));
        
        return jsonResponse({ success: true, data: testsWithCount });
      }

      // Admin - Get questions for a specific mock test
      if (path === '/admin/questions') {
        const mockTestId = searchParams.get('mockTestId');
        const questions = await getCollection('questions');
        
        // Support both mockTestId and test_id field names
        const query = mockTestId ? { $or: [{ mockTestId }, { test_id: mockTestId }] } : {};
        const allQuestions = await questions.find(query).sort({ question_number: 1 }).toArray();
        
        return jsonResponse({ success: true, data: allQuestions });
      }

      // Admin - Get all jobs
      if (path === '/admin/jobs') {
        const jobs = await getCollection('jobs');
        return jsonResponse({ success: true, data: await jobs.find({}).toArray() });
      }

      // Admin - Get all colleges
      if (path === '/admin/colleges') {
        const colleges = await getCollection('colleges');
        return jsonResponse({ success: true, data: await colleges.find({}).toArray() });
      }

      // Admin - Get testimonials
      if (path === '/admin/testimonials') {
        const testimonials = await getCollection('testimonials');
        return jsonResponse({ success: true, data: await testimonials.find({}).toArray() });
      }

      // Admin - Get contact leads
      if (path === '/admin/contacts') {
        const contacts = await getCollection('contact_leads');
        return jsonResponse({ success: true, data: await contacts.find({}).sort({ createdAt: -1 }).toArray() });
      }

      // Admin - Get transactions
      if (path === '/admin/transactions') {
        const transactions = await getCollection('transactions');
        return jsonResponse({ success: true, data: await transactions.find({}).sort({ createdAt: -1 }).toArray() });
      }

      // Admin - Get all answer keys
      if (path === '/admin/answer-keys') {
        const keys = await getCollection('answer_keys');
        const all = await keys.find({}).sort({ createdAt: -1 }).toArray();
        return jsonResponse({ success: true, data: all });
      }

      // Admin - Get single answer key (with answers)
      if (path.startsWith('/admin/answer-keys/')) {
        const akId = path.split('/admin/answer-keys/')[1];
        const keys = await getCollection('answer_keys');
        const k = await keys.findOne({ id: akId });
        if (!k) return jsonResponse({ success: false, error: 'Answer key not found' }, 404);
        return jsonResponse({ success: true, data: k });
      }

      // Admin - Get rank prediction submissions
      if (path === '/admin/rank-predictions') {
        const rp = await getCollection('rank_predictions');
        const data = await rp.find({}, { projection: { userAnswers: 0 } }).sort({ createdAt: -1 }).limit(500).toArray();
        return jsonResponse({ success: true, data });
      }
    }

    return jsonResponse({ success: true, message: 'Unishaala API' });
  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

// OPTIONS handler for CORS preflight requests (required for payment gateway callbacks)
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// POST Requests Handler
export async function POST(request) {
  const path = getPath(request);

  try {
    // Special handling for ICICI payment return - reads form-data instead of JSON
    if (path === '/payment/icici/return') {
      await connectToDatabase();
      const transactions = await getCollection('transactions');
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      
      let formDataObj = {};
      
      try {
        // Try to read as form-data first (ICICI sends form-data)
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
          const formData = await request.formData();
          // Convert FormData to plain object
          for (const [key, value] of formData.entries()) {
            formDataObj[key] = value;
          }
        } else {
          // Fallback to JSON if not form-data
          formDataObj = await request.json().catch(() => ({}));
        }
        
        console.log('=== ICICI RETURN PAYLOAD ===');
        console.log('Content-Type:', contentType);
        console.log('Parsed Payload:', JSON.stringify(formDataObj, null, 2));
        console.log('============================');
        
      } catch (parseError) {
        console.error('Error parsing ICICI return payload:', parseError);
        // Try to get raw text for debugging
        try {
          const clonedRequest = request.clone();
          const rawText = await clonedRequest.text();
          console.log('Raw body text:', rawText);
          // Try URL-encoded parsing manually
          const params = new URLSearchParams(rawText);
          for (const [key, value] of params.entries()) {
            formDataObj[key] = value;
          }
        } catch (e) {
          console.error('Failed to read raw body:', e);
        }
      }
      
      // Extract fields from the payload
      const {
        merchantTxnNo,
        txnID,
        txnStatus,
        responseCode,
        txnResponseCode,
        respDescription,
        txnRespDescription,
        amount,
        paymentMode,
        txnAuthID,
        authCode,
        paymentDateTime,
        paymentSubInstType,
        addlParam1,
        addlParam2,
        secureHash,
        oth_charge,
        paymentID,
        ...otherFields
      } = formDataObj;

      // If no merchantTxnNo, return HTML redirect page
      if (!merchantTxnNo) {
        console.error('No merchantTxnNo in ICICI return:', formDataObj);
        const redirectUrl = `${baseUrl}/payment/failed?reason=Invalid%20payment%20response`;
        return new NextResponse(
          `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${redirectUrl}"></head><body><p>Redirecting...</p><script>window.location.href="${redirectUrl}";</script></body></html>`,
          { 
            status: 200, 
            headers: { 'Content-Type': 'text/html' } 
          }
        );
      }

      // Find transaction
      const transaction = await transactions.findOne({ merchantTxnNo });
      
      if (!transaction) {
        console.error('Transaction not found for ICICI return:', merchantTxnNo);
        const redirectUrl = `${baseUrl}/payment/failed?reason=Transaction%20not%20found&txn=${merchantTxnNo}`;
        return new NextResponse(
          `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${redirectUrl}"></head><body><p>Redirecting...</p><script>window.location.href="${redirectUrl}";</script></body></html>`,
          { 
            status: 200, 
            headers: { 'Content-Type': 'text/html' } 
          }
        );
      }

      // Determine status - ICICI uses responseCode "0000" for success
      const actualResponseCode = responseCode || txnResponseCode;
      const actualRespDescription = respDescription || txnRespDescription;
      const isSuccess = txnStatus === 'SUC' || actualResponseCode === '0000';
      const status = isSuccess ? 'SUCCESS' : (txnStatus === 'PEN' ? 'PENDING' : 'FAILED');

      // Update transaction with full ICICI payload
      await transactions.updateOne(
        { merchantTxnNo },
        {
          $set: {
            status,
            iciciTransactionId: txnID || paymentID || null,
            txnAuthID: txnAuthID || authCode || null,
            txnResponseCode: actualResponseCode || null,
            txnRespDescription: actualRespDescription || null,
            paymentMethod: paymentMode || null,
            paymentSubInstType: paymentSubInstType || null,
            paymentDateTime: paymentDateTime || null,
            otherCharges: oth_charge || null,
            iciciPayload: formDataObj, // Store full ICICI payload as JSON
            gatewayResponse: formDataObj,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // If success, grant access to the exam/test
      if (isSuccess && transaction.examId) {
        const users = await getCollection('users');
        await users.updateOne(
          { id: transaction.userId },
          { $addToSet: { purchasedExams: transaction.examId } }
        );
      }

      // Build redirect URL
      const redirectUrl = isSuccess 
        ? `${baseUrl}/payment/success?txn=${merchantTxnNo}`
        : `${baseUrl}/payment/failed?txn=${merchantTxnNo}&reason=${encodeURIComponent(actualRespDescription || 'Payment failed')}`;

      console.log('Redirecting to:', redirectUrl);

      // Return HTML page with meta redirect to avoid Next.js Server Actions validation
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <title>Processing Payment...</title>
  <style>
    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); }
    .container { text-align: center; padding: 40px; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #14b8a6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    p { color: #666; font-size: 16px; }
    a { color: #14b8a6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p>Processing your payment...</p>
    <p><a href="${redirectUrl}">Click here if you are not redirected automatically</a></p>
  </div>
  <script>window.location.href="${redirectUrl}";</script>
</body>
</html>`,
        { 
          status: 200, 
          headers: { 'Content-Type': 'text/html; charset=utf-8' } 
        }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Ensure database is connected for all POST endpoints
    await connectToDatabase();

    // User Registration
    if (path === '/auth/signup') {
      const { name, email, phone, password, phoneVerified } = body;
      
      if (!name || !email || !password) {
        return jsonResponse({ success: false, error: 'Name, email and password are required' }, 400);
      }

      if (!phone) {
        return jsonResponse({ success: false, error: 'Phone number is required' }, 400);
      }

      const users = await getCollection('users');
      const existingUser = await users.findOne({ email });
      
      if (existingUser) {
        return jsonResponse({ success: false, error: 'Email already registered' }, 400);
      }

      // Check if phone already registered
      const existingPhone = await users.findOne({ phone });
      if (existingPhone) {
        return jsonResponse({ success: false, error: 'Phone number already registered' }, 400);
      }

      const hashedPassword = await hashPassword(password);
      
      const newUser = {
        id: uuidv4(),
        name,
        email,
        phone: phone || '',
        password: hashedPassword,
        role: 'USER',
        isVerified: phoneVerified === true, // Verified if phone OTP was verified
        phoneVerified: phoneVerified === true,
        authProvider: 'local',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await users.insertOne(newUser);

      return jsonResponse({
        success: true,
        message: 'Registration successful.',
        data: { userId: newUser.id, email }
      });
    }

    // OTP Verification
    if (path === '/auth/verify-otp') {
      const { email, otp } = body;
      
      const users = await getCollection('users');
      const user = await users.findOne({ email });
      
      if (!user) {
        return jsonResponse({ success: false, error: 'User not found' }, 404);
      }

      if (user.otp !== otp) {
        return jsonResponse({ success: false, error: 'Invalid OTP' }, 400);
      }

      if (new Date() > new Date(user.otpExpiry)) {
        return jsonResponse({ success: false, error: 'OTP expired' }, 400);
      }

      await users.updateOne(
        { email },
        { $set: { isVerified: true, otp: null, otpExpiry: null } }
      );

      const token = createToken({ userId: user.id, email: user.email, role: user.role, phoneVerified: user.phoneVerified === true });
      
      const response = jsonResponse({
        success: true,
        message: 'Email verified successfully',
        data: { token }
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60
      });

      return response;
    }

    // User Login
    if (path === '/auth/login') {
      const { email, password } = body;
      
      if (!email || !password) {
        return jsonResponse({ success: false, error: 'Email and password are required' }, 400);
      }

      const users = await getCollection('users');
      const user = await users.findOne({ email });
      
      if (!user) {
        return jsonResponse({ success: false, error: 'Invalid credentials' }, 401);
      }

      const isValid = await verifyPassword(password, user.password);
      
      if (!isValid) {
        return jsonResponse({ success: false, error: 'Invalid credentials' }, 401);
      }

      const token = createToken({ userId: user.id, email: user.email, role: user.role, phoneVerified: user.phoneVerified === true });
      
      const response = jsonResponse({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phoneVerified: user.phoneVerified === true
          }
        }
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60
      });

      return response;
    }

    // Logout
    if (path === '/auth/logout') {
      const response = jsonResponse({ success: true, message: 'Logged out successfully' });
      response.cookies.delete('auth_token');
      return response;
    }

    // Send Phone OTP via Twilio
    if (path === '/auth/send-otp') {
      const { phone } = body;
      
      if (!phone) {
        return jsonResponse({ success: false, error: 'Phone number is required' }, 400);
      }

      try {
        const twilio = require('twilio');
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );

        const verification = await client.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verifications.create({ to: phone, channel: 'sms' });

        return jsonResponse({
          success: true,
          message: 'OTP sent successfully',
          data: { status: verification.status }
        });
      } catch (error) {
        console.error('Twilio error:', error);
        return jsonResponse({ success: false, error: 'Failed to send OTP. Please check phone number.' }, 400);
      }
    }

    // Verify Phone OTP via Twilio
    if (path === '/auth/verify-phone-otp') {
      const { phone, code } = body;
      
      if (!phone || !code) {
        return jsonResponse({ success: false, error: 'Phone and OTP code are required' }, 400);
      }

      try {
        const twilio = require('twilio');
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );

        const verificationCheck = await client.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({ to: phone, code: code });

        if (verificationCheck.status === 'approved') {
          return jsonResponse({
            success: true,
            message: 'Phone verified successfully',
            data: { verified: true }
          });
        } else {
          return jsonResponse({ success: false, error: 'Invalid OTP' }, 400);
        }
      } catch (error) {
        console.error('Twilio verification error:', error);
        return jsonResponse({ success: false, error: 'Verification failed' }, 400);
      }
    }

    // Verify phone for the currently logged-in user and persist phoneVerified=true on their profile.
    // Used for gating protected content (e.g., full PDF view / download).
    if (path === '/auth/verify-my-phone') {
      const currentUser = await getAuthUser(request);
      if (!currentUser) {
        return jsonResponse({ success: false, error: 'Login required' }, 401);
      }

      const { phone, code } = body;
      const targetPhone = (phone || currentUser.phone || '').toString().trim();
      if (!targetPhone || !code) {
        return jsonResponse({ success: false, error: 'Phone and OTP code are required' }, 400);
      }

      try {
        const twilio = require('twilio');
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );

        const check = await client.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({ to: targetPhone, code });

        if (check.status !== 'approved') {
          return jsonResponse({ success: false, error: 'Invalid OTP' }, 400);
        }

        const users = await getCollection('users');
        await users.updateOne(
          { id: currentUser.id },
          { $set: { phone: targetPhone, phoneVerified: true, updatedAt: new Date() } }
        );
        const updated = await users.findOne({ id: currentUser.id });
        const { password, otp, otpExpiry, ...safe } = updated || {};

        // Re-issue JWT with phoneVerified:true so middleware sees the updated state
        const newToken = createToken({
          userId: updated.id,
          email: updated.email,
          role: updated.role,
          phoneVerified: true
        });
        const response = jsonResponse({
          success: true,
          message: 'Phone verified successfully',
          data: safe
        });
        response.cookies.set('auth_token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60
        });
        return response;
      } catch (error) {
        console.error('Phone verify-my-phone error:', error);
        return jsonResponse({ success: false, error: 'Verification failed' }, 400);
      }
    }

    // Google OAuth Callback
    if (path === '/auth/google-callback') {
      const { sessionId } = body;
      
      if (!sessionId) {
        return jsonResponse({ success: false, error: 'Session ID is required' }, 400);
      }

      try {
        // Exchange session_id for user data from Emergent Auth
        const authResponse = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
          method: 'GET',
          headers: {
            'X-Session-ID': sessionId
          }
        });

        if (!authResponse.ok) {
          return jsonResponse({ success: false, error: 'Invalid session' }, 401);
        }

        const authData = await authResponse.json();
        const { email, name, picture, session_token } = authData;

        // Check if user exists or create new one
        const users = await getCollection('users');
        let user = await users.findOne({ email });

        if (!user) {
          // Create new user from Google auth
          user = {
            id: uuidv4(),
            name: name || email.split('@')[0],
            email,
            phone: '',
            password: '', // Google users don't have password
            role: 'USER',
            isVerified: true,
            phoneVerified: false,
            picture: picture || '',
            authProvider: 'google',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await users.insertOne(user);
        } else {
          // Update existing user with Google data
          await users.updateOne(
            { email },
            { 
              $set: { 
                name: name || user.name,
                picture: picture || user.picture,
                isVerified: true,
                updatedAt: new Date()
              } 
            }
          );
          user = await users.findOne({ email });
        }

        // Create our own token
        const token = createToken({ userId: user.id, email: user.email, role: user.role, phoneVerified: user.phoneVerified === true });
        
        const response = jsonResponse({
          success: true,
          message: 'Login successful',
          data: {
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              picture: user.picture,
              phoneVerified: user.phoneVerified === true
            }
          }
        });

        response.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/',
          maxAge: 7 * 24 * 60 * 60
        });

        return response;
      } catch (error) {
        console.error('Google auth error:', error);
        return jsonResponse({ success: false, error: 'Authentication failed' }, 500);
      }
    }

    // Contact Form
    if (path === '/contact') {
      const { name, email, phone, subject, message } = body;
      
      if (!name || !email || !message) {
        return jsonResponse({ success: false, error: 'Name, email and message are required' }, 400);
      }

      const contacts = await getCollection('contact_leads');
      await contacts.insertOne({
        id: uuidv4(),
        name,
        email,
        phone: phone || '',
        subject: subject || '',
        message,
        status: 'New',
        createdAt: new Date()
      });

      return jsonResponse({ success: true, message: 'Message sent successfully' });
    }

    // Public - Submit rank prediction
    if (path === '/predict-rank') {
      try {
        const { answerKeyId, name, email, phone, category, responseHtml, responseUrl, manualAnswers } = body;

        if (!answerKeyId) return jsonResponse({ success: false, error: 'answerKeyId is required' }, 400);
        if (!name || !String(name).trim()) return jsonResponse({ success: false, error: 'Name is required' }, 400);
        if (!email || !String(email).trim()) return jsonResponse({ success: false, error: 'Email is required' }, 400);

        const keys = await getCollection('answer_keys');
        const key = await keys.findOne({ id: answerKeyId });
        if (!key) return jsonResponse({ success: false, error: 'Answer key not found' }, 404);
        if (!key.answers || key.answers.length === 0) {
          return jsonResponse({ success: false, error: 'Selected answer key has no questions uploaded yet' }, 400);
        }

        // extracted: { byId, byIndex, errorPage, totalFound }
        // Each entry is { type, status, answer }
        let extracted = { byId: {}, byIndex: {}, errorPage: false, totalFound: 0 };
        let source = 'manual';

        if (manualAnswers && typeof manualAnswers === 'object' && !Array.isArray(manualAnswers) && Object.keys(manualAnswers).length > 0) {
          for (const [k, v] of Object.entries(manualAnswers)) {
            const qkey = normalizeQid(k);
            const rawV = v === null || v === undefined ? '' : String(v).trim();
            let answer = '';
            let type = '';
            if (rawV && !/^-+$/.test(rawV)) {
              if (/[,|;]/.test(rawV) && /^[A-H](?:\s*[,|;]\s*[A-H])+$/i.test(rawV)) {
                answer = rawV.toUpperCase().split(/[,|;]/).map(s => s.trim()).sort().join(',');
                type = 'MSQ';
              } else if (/^-?\d+(\.\d+)?$/.test(rawV)) {
                answer = rawV;
                type = 'NAT';
              } else {
                answer = normalizeAnswer(rawV);
                type = 'MCQ';
              }
            }
            const entry = { type, status: answer ? 'Answered' : 'Not Answered', answer };
            if (/^[0-9]+$/.test(qkey)) extracted.byIndex[qkey] = entry;
            else extracted.byId[qkey] = entry;
            extracted.totalFound++;
          }
          source = 'manual';
        } else if (manualAnswers && typeof manualAnswers === 'string') {
          extracted = parseSimpleAnswers(manualAnswers);
          source = 'manual-text';
        } else if (responseHtml) {
          extracted = parseResponseSheetHTML(responseHtml);
          source = 'html-upload';
          if (extracted.errorPage) {
            return jsonResponse({
              success: false,
              error: 'The uploaded HTML looks like an error page — not a real response sheet. Please re-save the response sheet from your browser and upload again.'
            }, 400);
          }
        } else if (responseUrl) {
          try {
            const res = await fetch(responseUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
              },
              redirect: 'follow'
            });
            if (!res.ok) {
              return jsonResponse({ success: false, error: `Could not fetch response sheet URL (HTTP ${res.status}). Please download the page from your browser (Ctrl+S) and use "Upload HTML" instead.` }, 400);
            }
            const html = await res.text();
            extracted = parseResponseSheetHTML(html);
            source = 'url';
            if (extracted.errorPage) {
              return jsonResponse({
                success: false,
                error: 'The response sheet URL returned an error page (likely geo-restricted or session-protected). Please open the URL in your browser, save the page (Ctrl+S), and use "Upload HTML" mode instead.'
              }, 400);
            }
          } catch (e) {
            return jsonResponse({ success: false, error: 'Could not fetch the response sheet URL. It may require login — please save the page and upload the HTML file.' }, 400);
          }
        } else {
          return jsonResponse({ success: false, error: 'Please provide responseHtml, responseUrl, or manualAnswers' }, 400);
        }

        if (extracted.totalFound === 0) {
          return jsonResponse({
            success: false,
            error: 'Could not extract any answers from the response sheet. The format may not be recognized. Please try Manual Entry mode or contact support.'
          }, 400);
        }

        // Evaluate
        const result = evaluateAnswers(extracted, key, key.positiveMarks ?? 1, key.negativeMarks ?? 0);

        // --- Debug logging for ID matching ---
        const extractedIds = Object.keys(extracted.byId || {});
        const csvIds = (key.answers || []).map(a => String(a.question_id));
        console.log('[predict-rank] source:', source, '| extracted IDs:', extractedIds.length, '| CSV IDs:', csvIds.length);
        if (extractedIds.length && csvIds.length) {
          const csvSet = new Set(csvIds);
          const matched = extractedIds.filter(id => csvSet.has(id)).length;
          console.log(`[predict-rank] matched ${matched}/${csvIds.length} by Question ID`);
          if (matched === 0) {
            console.log('[predict-rank] ⚠ NO ID MATCHES - sample extracted:', extractedIds.slice(0, 3), 'vs CSV:', csvIds.slice(0, 3));
          }
        }
        if (result.unmatchedIds && result.unmatchedIds.length > 0) {
          console.log('[predict-rank] Unmatched CSV IDs:', result.unmatchedIds.length, 'of', csvIds.length);
        }

        // Store submission (remove previous by same email+key)
        const user = await getAuthUser(request);
        const predictionsCol = await getCollection('rank_predictions');
        const normCategory = (category || 'General').trim();
        const submission = {
          id: uuidv4(),
          userId: user?.id || null,
          name: String(name).trim(),
          email: String(email).trim().toLowerCase(),
          phone: phone || '',
          category: normCategory,
          answerKeyId,
          answerKeyTitle: key.title,
          totalQuestions: result.totalQuestions,
          attempted: result.attempted,
          correct: result.correct,
          wrong: result.wrong,
          unattempted: result.unattempted,
          marks: result.marks,
          maxMarks: result.maxMarks,
          percentage: result.maxMarks ? +((result.marks / result.maxMarks) * 100).toFixed(2) : 0,
          extractedById: extracted.byId,
          extractedByIndex: extracted.byIndex,
          source,
          createdAt: new Date()
        };

        await predictionsCol.deleteMany({ answerKeyId, email: submission.email });
        await predictionsCol.insertOne(submission);

        // Compute ranks
        const allSubs = await predictionsCol.find({ answerKeyId }).project({ marks: 1, category: 1, email: 1 }).toArray();
        const totalParticipants = allSubs.length;
        const higher = allSubs.filter(s => s.marks > result.marks).length;
        const overallRank = higher + 1;
        const categorySubs = allSubs.filter(s => (s.category || 'General') === normCategory);
        const categoryTotal = categorySubs.length;
        const catHigher = categorySubs.filter(s => s.marks > result.marks).length;
        const categoryRank = catHigher + 1;
        const percentile = totalParticipants > 1 ? +(((totalParticipants - overallRank) / (totalParticipants - 1)) * 100).toFixed(2) : 100;

        return jsonResponse({
          success: true,
          data: {
            submissionId: submission.id,
            marks: result.marks,
            maxMarks: result.maxMarks,
            percentage: submission.percentage,
            totalQuestions: result.totalQuestions,
            attempted: result.attempted,
            correct: result.correct,
            wrong: result.wrong,
            unattempted: result.unattempted,
            positiveMarks: key.positiveMarks ?? 1,
            negativeMarks: key.negativeMarks ?? 0,
            overallRank,
            categoryRank,
            category: normCategory,
            categoryTotal,
            totalParticipants,
            percentile,
            extractedAnswerCount: extracted.totalFound,
            extractedQuestionIds: extractedIds.slice(0, 200),
            unmatchedCsvIds: result.unmatchedIds || [],
            source,
            details: result.details
          }
        });
      } catch (e) {
        console.error('predict-rank error:', e);
        return jsonResponse({ success: false, error: e.message || 'Failed to predict rank' }, 500);
      }
    }

    // Process ICICI payment callback (called from client-side page)
    if (path === '/payment/process-callback') {
      const transactions = await getCollection('transactions');
      
      const {
        merchantTxnNo,
        txnID,
        txnStatus,
        responseCode,
        txnResponseCode,
        respDescription,
        txnRespDescription,
        amount,
        paymentMode,
        txnAuthID,
        authCode,
        paymentDateTime,
        paymentSubInstType,
        oth_charge,
        paymentID,
      } = body;

      if (!merchantTxnNo) {
        return corsJsonResponse({ success: false, error: 'Missing transaction ID' }, 400);
      }

      // Find transaction in local DB
      let transaction = await transactions.findOne({ merchantTxnNo });
      
      // If not found locally, verify with ICICI directly
      if (!transaction) {
        console.log(`Transaction ${merchantTxnNo} not found locally, checking with ICICI...`);
        
        // Try to get status from ICICI
        const iciciStatus = await checkICICITransactionStatus(merchantTxnNo);
        
        if (iciciStatus && iciciStatus.payload) {
          console.log('ICICI returned status:', iciciStatus.status);
          
          // Create a record for this transaction (it was initiated from another environment)
          const newTransaction = {
            id: uuidv4(),
            merchantTxnNo,
            status: iciciStatus.status,
            amount: amount || iciciStatus.payload.amount || 0,
            iciciTransactionId: txnID || iciciStatus.payload.txnID || paymentID,
            iciciPayload: iciciStatus.payload,
            gatewayResponse: body,
            crossEnvironment: true, // Flag indicating this was from another deployment
            createdAt: new Date(),
            completedAt: new Date(),
            updatedAt: new Date()
          };
          
          await transactions.insertOne(newTransaction);
          
          return corsJsonResponse({ 
            success: true, 
            status: iciciStatus.status, 
            merchantTxnNo,
            message: 'Transaction verified with ICICI',
            iciciPayload: iciciStatus.payload
          });
        }
        
        // If ICICI also doesn't recognize it, return error
        return corsJsonResponse({ success: false, error: 'Transaction not found' }, 404);
      }

      // Determine status from callback data
      const actualResponseCode = responseCode || txnResponseCode;
      const actualRespDescription = respDescription || txnRespDescription;
      const isSuccess = txnStatus === 'SUC' || actualResponseCode === '0000';
      const status = isSuccess ? 'SUCCESS' : (txnStatus === 'PEN' ? 'PENDING' : 'FAILED');

      // Update transaction with ICICI payload
      await transactions.updateOne(
        { merchantTxnNo },
        {
          $set: {
            status,
            iciciTransactionId: txnID || paymentID || null,
            txnAuthID: txnAuthID || authCode || null,
            txnResponseCode: actualResponseCode || null,
            txnRespDescription: actualRespDescription || null,
            paymentMethod: paymentMode || null,
            paymentSubInstType: paymentSubInstType || null,
            paymentDateTime: paymentDateTime || null,
            otherCharges: oth_charge || null,
            iciciPayload: body,
            gatewayResponse: body,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // If success, grant access
      if (isSuccess && transaction.examId) {
        const users = await getCollection('users');
        await users.updateOne(
          { id: transaction.userId },
          { $addToSet: { purchasedExams: transaction.examId } }
        );
      }

      return corsJsonResponse({ success: true, status, merchantTxnNo });
    }

    // Check payment status by session/latest transaction
    if (path === '/payment/check-status-by-session') {
      const user = await getAuthUser(request);
      
      const transactions = await getCollection('transactions');
      let transaction;
      
      if (user) {
        // Get latest transaction for this user
        transaction = await transactions.findOne(
          { userId: user.id },
          { sort: { createdAt: -1 } }
        );
      }
      
      // Also try to get from body if merchantTxnNo is provided
      if (!transaction && body.merchantTxnNo) {
        transaction = await transactions.findOne({ merchantTxnNo: body.merchantTxnNo });
        
        // If not found locally but we have a txn ID, check with ICICI directly
        if (!transaction) {
          console.log(`Transaction ${body.merchantTxnNo} not in local DB, checking ICICI...`);
          try {
            const iciciStatus = await checkICICITransactionStatus(body.merchantTxnNo);
            if (iciciStatus && iciciStatus.payload) {
              // Create a local record for tracking
              const newTxn = {
                id: uuidv4(),
                merchantTxnNo: body.merchantTxnNo,
                status: iciciStatus.status,
                amount: iciciStatus.payload.amount || 0,
                iciciPayload: iciciStatus.payload,
                crossEnvironment: true,
                verifiedWithIcici: true,
                createdAt: new Date(),
                completedAt: new Date(),
                updatedAt: new Date()
              };
              await transactions.insertOne(newTxn);
              
              return corsJsonResponse({
                success: true,
                transaction: {
                  merchantTxnNo: body.merchantTxnNo,
                  status: iciciStatus.status,
                  amount: iciciStatus.payload.amount || 0,
                  iciciPayload: iciciStatus.payload,
                  verifiedWithIcici: true
                }
              });
            }
          } catch (e) {
            console.error('Error verifying with ICICI:', e);
          }
        }
      }

      if (!transaction) {
        return corsJsonResponse({ success: false, error: 'No transaction found' }, 404);
      }

      // If still pending, try to check with ICICI status API
      if (transaction.status === 'PENDING') {
        try {
          const statusResult = await checkICICITransactionStatus(transaction.merchantTxnNo);
          if (statusResult && statusResult.status !== 'PENDING') {
            // Update transaction
            await transactions.updateOne(
              { merchantTxnNo: transaction.merchantTxnNo },
              {
                $set: {
                  status: statusResult.status,
                  iciciPayload: statusResult.payload,
                  gatewayResponse: statusResult.payload,
                  updatedAt: new Date(),
                  completedAt: new Date()
                }
              }
            );
            transaction.status = statusResult.status;
            transaction.iciciPayload = statusResult.payload;

            // Grant access if success
            if (statusResult.status === 'SUCCESS' && transaction.examId) {
              const users = await getCollection('users');
              await users.updateOne(
                { id: transaction.userId },
                { $addToSet: { purchasedExams: transaction.examId } }
              );
            }
          }
        } catch (e) {
          console.error('Error checking ICICI status:', e);
        }
      }

      return corsJsonResponse({
        success: true,
        transaction: {
          merchantTxnNo: transaction.merchantTxnNo,
          status: transaction.status,
          amount: transaction.amount,
          itemName: transaction.itemName,
          iciciPayload: transaction.iciciPayload,
          createdAt: transaction.createdAt
        }
      });
    }

    // Process ICICI payment return (called from page handler) - kept for backwards compatibility
    if (path === '/payment/process-return') {
      const transactions = await getCollection('transactions');
      
      const {
        merchantTxnNo,
        txnID,
        txnStatus,
        responseCode,
        txnResponseCode,
        respDescription,
        txnRespDescription,
        amount,
        paymentMode,
        txnAuthID,
        authCode,
        paymentDateTime,
        paymentSubInstType,
        oth_charge,
        paymentID,
      } = body;

      if (!merchantTxnNo) {
        return jsonResponse({ success: false, error: 'Missing transaction ID' }, 400);
      }

      // Find transaction
      const transaction = await transactions.findOne({ merchantTxnNo });
      
      if (!transaction) {
        return jsonResponse({ success: false, error: 'Transaction not found' }, 404);
      }

      // Determine status
      const actualResponseCode = responseCode || txnResponseCode;
      const actualRespDescription = respDescription || txnRespDescription;
      const isSuccess = txnStatus === 'SUC' || actualResponseCode === '0000';
      const status = isSuccess ? 'SUCCESS' : (txnStatus === 'PEN' ? 'PENDING' : 'FAILED');

      // Update transaction
      await transactions.updateOne(
        { merchantTxnNo },
        {
          $set: {
            status,
            iciciTransactionId: txnID || paymentID || null,
            txnAuthID: txnAuthID || authCode || null,
            txnResponseCode: actualResponseCode || null,
            txnRespDescription: actualRespDescription || null,
            paymentMethod: paymentMode || null,
            paymentSubInstType: paymentSubInstType || null,
            paymentDateTime: paymentDateTime || null,
            otherCharges: oth_charge || null,
            iciciPayload: body,
            gatewayResponse: body,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // If success, grant access
      if (isSuccess && transaction.examId) {
        const users = await getCollection('users');
        await users.updateOne(
          { id: transaction.userId },
          { $addToSet: { purchasedExams: transaction.examId } }
        );
      }

      return jsonResponse({ success: true, status, merchantTxnNo });
    }

    // Check latest payment status for current user
    if (path === '/payment/check-latest') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Not authenticated' }, 401);
      }

      const transactions = await getCollection('transactions');
      const latestTransaction = await transactions.findOne(
        { userId: user.id },
        { sort: { createdAt: -1 } }
      );

      if (!latestTransaction) {
        return jsonResponse({ success: false, error: 'No transactions found' }, 404);
      }

      // If transaction is still pending, try to check status with ICICI
      if (latestTransaction.status === 'PENDING') {
        try {
          const statusResult = await checkICICITransactionStatus(latestTransaction.merchantTxnNo);
          if (statusResult && statusResult.status !== 'PENDING') {
            // Update transaction with new status
            await transactions.updateOne(
              { merchantTxnNo: latestTransaction.merchantTxnNo },
              {
                $set: {
                  status: statusResult.status,
                  iciciPayload: statusResult.payload,
                  updatedAt: new Date()
                }
              }
            );
            latestTransaction.status = statusResult.status;
          }
        } catch (e) {
          console.error('Error checking ICICI status:', e);
        }
      }

      return jsonResponse({ 
        success: true, 
        transaction: {
          merchantTxnNo: latestTransaction.merchantTxnNo,
          status: latestTransaction.status,
          amount: latestTransaction.amount,
          itemName: latestTransaction.itemName
        }
      });
    }

    // ============================================
    // ICICI Orange PG Payment Gateway Integration
    // ============================================

    // Initiate Payment - ICICI Orange PG
    if (path === '/payment/initiate') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Please login to make payment' }, 401);
      }

      const { examId, mockTestId, amount, paymentType } = body;
      
      if (!amount || amount <= 0) {
        return jsonResponse({ success: false, error: 'Invalid amount' }, 400);
      }

      // Generate unique transaction ID - alphanumeric only (12 digits as per sample)
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const merchantTxnNo = timestamp + random; // e.g., "329637391234" (12 chars)

      // Get exam/test details
      let itemName = 'Test Purchase';
      let itemId = mockTestId || examId;
      
      if (examId) {
        const exams = await getCollection('exams');
        const exam = await exams.findOne({ id: examId });
        if (exam) itemName = `${exam.name} - Full Access`;
      } else if (mockTestId) {
        const mockTests = await getCollection('mock_tests');
        const test = await mockTests.findOne({ id: mockTestId });
        if (test) itemName = test.title;
      }

      // Create transaction record
      const transactions = await getCollection('transactions');
      const transaction = {
        id: uuidv4(),
        transactionId: merchantTxnNo,
        merchantTxnNo,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone || '',
        examId: examId || null,
        mockTestId: mockTestId || null,
        paymentType: paymentType || 'exam_purchase',
        itemName,
        amount: parseFloat(amount),
        currency: 'INR',
        status: 'PENDING',
        paymentMethod: null,
        gatewayResponse: null,
        iciciTransactionId: null,
        refundStatus: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Creating transaction:', merchantTxnNo);
      const insertResult = await transactions.insertOne(transaction);
      console.log('Transaction created:', merchantTxnNo, 'insertedId:', insertResult.insertedId);
      
      // Verify the transaction was saved
      const savedTxn = await transactions.findOne({ merchantTxnNo });
      console.log('Verified transaction saved:', savedTxn ? 'YES' : 'NO');

      // Prepare ICICI Orange PG request
      const crypto = require('crypto');
      
      // Dynamically detect base URL from request headers (works for both preview and production)
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_BASE_URL;
      console.log('Payment return URL will use baseUrl:', baseUrl);
      
      // Format date as YYYYMMDDHHMMSS
      const now = new Date();
      const txnDate = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

      // Format phone number - must be in format 91XXXXXXXXXX
      let phoneNumber = (user.phone || '9999999999').replace(/[^0-9]/g, '');
      if (phoneNumber.length === 10) {
        phoneNumber = '91' + phoneNumber;
      } else if (phoneNumber.startsWith('91') && phoneNumber.length === 12) {
        // Already correct
      } else {
        phoneNumber = '919999999999'; // fallback
      }

      // Build payload with exact field names as per ICICI documentation
      const addlParam1 = '000'; // Additional parameter 1
      const addlParam2 = itemId || '111'; // Additional parameter 2 - store item ID
      const amountStr = parseFloat(amount).toFixed(2);
      const currencyCode = '356';
      const customerEmailID = user.email;
      const customerMobileNo = phoneNumber;
      const customerName = user.name.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50); // Alphanumeric only
      const merchantId = process.env.ICICI_MID;
      const payType = '0'; // 0 = All payment modes
      // Use static HTML file for return URL to avoid 403 from WAF
      const returnURL = `${baseUrl}/payment-return.html`;
      const transactionType = 'SALE';
      const aggregatorID = process.env.ICICI_AGG_ID;

      // Generate secureHash - EXACT order as per ICICI Step Wise Document (alphabetically sorted):
      // addlParam1 + addlParam2 + aggregatorID + amount + currencyCode + customerEmailID + 
      // customerMobileNo + customerName + merchantId + merchantTxnNo + 
      // payType + returnURL + transactionType + txnDate
      const hashText = addlParam1 + addlParam2 + aggregatorID + amountStr + currencyCode + 
        customerEmailID + customerMobileNo + customerName + merchantId + 
        merchantTxnNo + payType + returnURL + transactionType + txnDate;
      
      // HMAC-SHA256 with the key
      const secureHash = crypto.createHmac('sha256', process.env.ICICI_KEY)
        .update(hashText, 'utf8')
        .digest('hex');

      // Build request payload
      const paymentData = {
        merchantId: merchantId,
        aggregatorID: aggregatorID,
        merchantTxnNo: merchantTxnNo,
        amount: amountStr,
        currencyCode: currencyCode,
        payType: payType,
        customerEmailID: customerEmailID,
        transactionType: transactionType,
        returnURL: returnURL,
        txnDate: txnDate,
        customerMobileNo: customerMobileNo,
        customerName: customerName,
        addlParam1: addlParam1,
        addlParam2: addlParam2,
        secureHash: secureHash
      };

      console.log('ICICI Payment Request:', JSON.stringify(paymentData, null, 2));
      console.log('HashText:', hashText);
      console.log('SecureHash:', secureHash);

      try {
        // Make POST request to ICICI initiateSale API
        const iciciResponse = await fetch(process.env.ICICI_SALE_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        });

        const iciciResult = await iciciResponse.json();
        console.log('ICICI Response:', JSON.stringify(iciciResult, null, 2));

        if (iciciResult.responseCode === 'R1000' && iciciResult.redirectURI) {
          // Success - construct payment URL
          const paymentUrl = `${iciciResult.redirectURI}?tranCtx=${iciciResult.tranCtx}`;
          
          // Update transaction with ICICI response
          await transactions.updateOne(
            { merchantTxnNo },
            {
              $set: {
                gatewayResponse: iciciResult,
                tranCtx: iciciResult.tranCtx,
                updatedAt: new Date()
              }
            }
          );

          return jsonResponse({
            success: true,
            data: {
              transactionId: merchantTxnNo,
              amount: parseFloat(amount),
              paymentUrl: paymentUrl,
              tranCtx: iciciResult.tranCtx
            }
          });
        } else {
          // Error from ICICI
          await transactions.updateOne(
            { merchantTxnNo },
            {
              $set: {
                status: 'FAILED',
                gatewayResponse: iciciResult,
                updatedAt: new Date()
              }
            }
          );

          return jsonResponse({
            success: false,
            error: iciciResult.respDescription || iciciResult.errorMsg || 'Payment initiation failed',
            data: iciciResult
          }, 400);
        }
      } catch (error) {
        console.error('ICICI API Error:', error);
        
        await transactions.updateOne(
          { merchantTxnNo },
          {
            $set: {
              status: 'FAILED',
              gatewayResponse: { error: error.message },
              updatedAt: new Date()
            }
          }
        );

        return jsonResponse({
          success: false,
          error: 'Payment gateway connection failed'
        }, 500);
      }
    }

    // Payment Callback - Handle ICICI Orange PG Response (POST from ICICI) - Legacy endpoint
    if (path === '/payment/callback') {
      const transactions = await getCollection('transactions');
      
      console.log('Payment Callback Body:', JSON.stringify(body, null, 2));
      
      // ICICI sends response in body
      const {
        merchantTxnNo,
        txnID,
        txnStatus,
        txnResponseCode,
        txnRespDescription,
        amount,
        paymentMode,
        txnAuthID,
        addlParam1, // userId
        addlParam2, // itemId
        secureHash: responseSecureHash
      } = body;

      // Find transaction
      const transaction = await transactions.findOne({ merchantTxnNo });
      
      if (!transaction) {
        console.error('Transaction not found:', merchantTxnNo);
        // Redirect to failed page
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        return NextResponse.redirect(`${baseUrl}/payment/failed?reason=Transaction%20not%20found`);
      }

      // Determine status
      const isSuccess = txnStatus === 'SUC' || txnResponseCode === '0000';
      const status = isSuccess ? 'SUCCESS' : (txnStatus === 'PEN' ? 'PENDING' : 'FAILED');

      // Update transaction status
      await transactions.updateOne(
        { merchantTxnNo },
        {
          $set: {
            status,
            iciciTransactionId: txnID,
            txnAuthID,
            paymentMethod: paymentMode,
            gatewayResponse: body,
            updatedAt: new Date()
          }
        }
      );

      // Redirect to appropriate page
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const redirectUrl = isSuccess 
        ? `${baseUrl}/payment/success?txn=${merchantTxnNo}`
        : `${baseUrl}/payment/failed?txn=${merchantTxnNo}&reason=${encodeURIComponent(txnRespDescription || 'Payment failed')}`;

      return NextResponse.redirect(redirectUrl);
    }

    // Check Payment Status
    if (path === '/payment/status') {
      const user = await getAuthUser(request);
      const { transactionId } = body;

      const transactions = await getCollection('transactions');
      let transaction = await transactions.findOne({ 
        $or: [
          { transactionId },
          { merchantTxnNo: transactionId }
        ]
      });

      // If not found locally, verify with ICICI directly
      if (!transaction && transactionId) {
        console.log(`Transaction ${transactionId} not found locally, verifying with ICICI...`);
        try {
          const iciciStatus = await checkICICITransactionStatus(transactionId);
          if (iciciStatus && iciciStatus.payload) {
            console.log('ICICI verification result:', iciciStatus.status);
            
            // Create a local record
            const newTxn = {
              id: uuidv4(),
              merchantTxnNo: transactionId,
              transactionId: transactionId,
              status: iciciStatus.status,
              amount: iciciStatus.payload.amount || 0,
              iciciPayload: iciciStatus.payload,
              crossEnvironment: true,
              verifiedWithIcici: true,
              createdAt: new Date(),
              completedAt: new Date(),
              updatedAt: new Date()
            };
            await transactions.insertOne(newTxn);
            
            return jsonResponse({
              success: true,
              data: {
                transactionId: transactionId,
                status: iciciStatus.status,
                amount: iciciStatus.payload.amount || 0,
                iciciPayload: iciciStatus.payload,
                verifiedWithIcici: true,
                message: 'Transaction verified directly with ICICI'
              }
            });
          }
        } catch (e) {
          console.error('Error verifying with ICICI:', e);
        }
        
        return jsonResponse({ success: false, error: 'Transaction not found' }, 404);
      }

      if (!transaction) {
        return jsonResponse({ success: false, error: 'Transaction not found' }, 404);
      }

      // If user is checking their own transaction or admin - skip auth check for cross-environment txns
      if (!transaction.crossEnvironment && transaction.userId !== user?.id && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 403);
      }

      return jsonResponse({
        success: true,
        data: {
          transactionId: transaction.merchantTxnNo || transaction.transactionId,
          orderId: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          itemName: transaction.itemName,
          paymentMethod: transaction.paymentMethod,
          paymentSubInstType: transaction.paymentSubInstType,
          iciciTransactionId: transaction.iciciTransactionId,
          txnAuthID: transaction.txnAuthID,
          txnResponseCode: transaction.txnResponseCode,
          txnRespDescription: transaction.txnRespDescription,
          paymentDateTime: transaction.paymentDateTime,
          otherCharges: transaction.otherCharges,
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt,
          iciciPayload: transaction.iciciPayload || transaction.gatewayResponse
        }
      });
    }

    // Get user's purchased tests/exams
    if (path === '/user/purchases') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Please login' }, 401);
      }

      const transactions = await getCollection('transactions');
      const purchases = await transactions.find({
        userId: user.id,
        status: 'SUCCESS'
      }).toArray();

      return jsonResponse({
        success: true,
        data: purchases.map(p => ({
          mockTestId: p.mockTestId,
          examId: p.examId,
          itemName: p.itemName,
          purchasedAt: p.completedAt || p.createdAt
        }))
      });
    }

    // Verify Payment (for exam access check)
    if (path === '/payment/verify-access') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Please login' }, 401);
      }

      const { examId, mockTestId } = body;
      const transactions = await getCollection('transactions');

      // Check for successful payment
      const query = {
        userId: user.id,
        status: 'SUCCESS'
      };

      if (examId) {
        query.examId = examId;
      } else if (mockTestId) {
        query.$or = [
          { mockTestId },
          { examId: { $exists: true, $ne: null } } // Check if exam purchase covers this test
        ];
      }

      const hasPurchased = await transactions.findOne(query);

      // If exam purchase, also check if mockTestId belongs to that exam
      if (!hasPurchased && mockTestId) {
        const mockTests = await getCollection('mock_tests');
        const test = await mockTests.findOne({ id: mockTestId });
        if (test?.examId) {
          const examPurchase = await transactions.findOne({
            userId: user.id,
            examId: test.examId,
            status: 'SUCCESS'
          });
          if (examPurchase) {
            return jsonResponse({ success: true, data: { hasAccess: true, purchaseType: 'exam' } });
          }
        }
      }

      return jsonResponse({
        success: true,
        data: {
          hasAccess: !!hasPurchased,
          purchaseType: hasPurchased?.examId ? 'exam' : (hasPurchased?.mockTestId ? 'test' : null)
        }
      });
    }

    // Request Refund
    if (path === '/payment/refund') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Please login' }, 401);
      }

      const { transactionId, reason } = body;
      const transactions = await getCollection('transactions');
      const transaction = await transactions.findOne({ 
        $or: [
          { transactionId, userId: user.id },
          { merchantTxnNo: transactionId, userId: user.id }
        ]
      });

      if (!transaction) {
        return jsonResponse({ success: false, error: 'Transaction not found' }, 404);
      }

      if (transaction.status !== 'SUCCESS') {
        return jsonResponse({ success: false, error: 'Only successful payments can be refunded' }, 400);
      }

      if (transaction.refundStatus === 'REQUESTED' || transaction.refundStatus === 'PROCESSED') {
        return jsonResponse({ success: false, error: 'Refund already requested' }, 400);
      }

      // Update with refund request
      await transactions.updateOne(
        { _id: transaction._id },
        {
          $set: {
            refundStatus: 'REQUESTED',
            refundReason: reason,
            refundRequestedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      return jsonResponse({
        success: true,
        message: 'Refund request submitted. We will process it within 5-7 business days.'
      });
    }

    // Admin: Process Refund via ICICI API
    if (path === '/admin/payment/process-refund') {
      const user = await getAuthUser(request);
      if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 403);
      }

      const { transactionId, refundAmount } = body;
      const transactions = await getCollection('transactions');
      const transaction = await transactions.findOne({ 
        $or: [
          { transactionId },
          { merchantTxnNo: transactionId }
        ]
      });

      if (!transaction) {
        return jsonResponse({ success: false, error: 'Transaction not found' }, 404);
      }

      try {
        // Call ICICI Refund API
        const crypto = require('crypto');
        const refundTxnNo = `REF${Date.now()}`;
        const originalTxnNo = transaction.merchantTxnNo || transaction.transactionId;
        
        const refundData = {
          merchantId: process.env.ICICI_MID,
          aggregatorID: process.env.ICICI_AGG_ID,
          merchantTxnNo: refundTxnNo,
          originalTxnNo: originalTxnNo,
          amount: (refundAmount || transaction.amount).toFixed(2),
          transactionType: 'REFUND'
        };

        // Generate secureHash for refund
        const sortedKeys = Object.keys(refundData).sort();
        let plainHashText = '';
        sortedKeys.forEach(key => {
          plainHashText += refundData[key];
        });
        
        const refundChecksum = crypto.createHmac('sha256', process.env.ICICI_KEY)
          .update(plainHashText)
          .digest('hex');
        refundData.secureHash = refundChecksum;

        const refundResponse = await fetch(process.env.ICICI_COMMAND_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(refundData)
        });

        const refundResult = await refundResponse.json();
        const isRefundSuccess = refundResult.responseCode === '000' || refundResult.txnStatus === 'SUC';

        // Update transaction
        await transactions.updateOne(
          { _id: transaction._id },
          {
            $set: {
              refundStatus: isRefundSuccess ? 'PROCESSED' : 'FAILED',
              refundTransactionId: refundTxnNo,
              refundAmount: parseFloat(refundAmount || transaction.amount),
              refundResponse: refundResult,
              refundProcessedAt: new Date(),
              updatedAt: new Date()
            }
          }
        );

        return jsonResponse({
          success: isRefundSuccess,
          message: isRefundSuccess ? 'Refund processed successfully' : 'Refund failed',
          data: refundResult
        });
      } catch (error) {
        console.error('Refund error:', error);
        return jsonResponse({ success: false, error: 'Refund processing failed' }, 500);
      }
    }

    // Admin: Get All Transactions
    if (path === '/admin/transactions') {
      const user = await getAuthUser(request);
      if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 403);
      }

      const transactions = await getCollection('transactions');
      const allTransactions = await transactions.find({})
        .sort({ createdAt: -1 })
        .limit(500)
        .toArray();

      // Calculate stats
      const stats = {
        total: allTransactions.length,
        successful: allTransactions.filter(t => t.status === 'SUCCESS').length,
        failed: allTransactions.filter(t => t.status === 'FAILED').length,
        pending: allTransactions.filter(t => t.status === 'PENDING').length,
        totalRevenue: allTransactions
          .filter(t => t.status === 'SUCCESS')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        refundRequests: allTransactions.filter(t => t.refundStatus === 'REQUESTED').length
      };

      return jsonResponse({
        success: true,
        data: allTransactions,
        stats
      });
    }

    // ============================================
    // End of Payment Gateway Integration
    // ============================================

    // Start Mock Test
    if (path === '/start-test') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Please login to start test' }, 401);
      }

      const { mockTestId } = body;
      const mockTests = await getCollection('mock_tests');
      const test = await mockTests.findOne({ id: mockTestId });
      
      if (!test) {
        return jsonResponse({ success: false, error: 'Mock test not found' }, 404);
      }

      // Check if published
      if (!test.isPublished) {
        return jsonResponse({ success: false, error: 'Test not available' }, 404);
      }

      // Check if it's a paid test
      if (!test.isFree && test.price > 0) {
        const transactions = await getCollection('transactions');
        
        // Check for direct test purchase OR exam-level purchase
        let hasPurchased = await transactions.findOne({
          userId: user.id,
          mockTestId,
          status: 'SUCCESS'
        });
        
        // Also check if user purchased the exam that contains this test
        if (!hasPurchased && test.examId) {
          hasPurchased = await transactions.findOne({
            userId: user.id,
            examId: test.examId,
            status: 'SUCCESS'
          });
        }
        
        if (!hasPurchased) {
          return jsonResponse({ 
            success: false, 
            error: 'Please purchase this test to continue',
            requirePayment: true,
            price: test.price 
          }, 402);
        }
      }

      // Get question count
      const questions = await getCollection('questions');
      const questionCount = await questions.countDocuments({ mockTestId, status: 'Active' });

      const attempts = await getCollection('test_attempts');
      const attempt = {
        id: uuidv4(),
        userId: user.id,
        mockTestId,
        startTime: new Date(),
        endTime: null,
        status: 'IN_PROGRESS',
        answers: {},
        score: 0,
        totalMarks: test.totalMarks || questionCount * 2,
        createdAt: new Date()
      };

      await attempts.insertOne(attempt);

      return jsonResponse({
        success: true,
        data: { attemptId: attempt.id, duration: test.duration, totalQuestions: questionCount }
      });
    }

    // Submit Test
    if (path === '/submit-test') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }

      const { attemptId, answers } = body;
      const attempts = await getCollection('test_attempts');
      const attempt = await attempts.findOne({ id: attemptId, userId: user.id });
      
      if (!attempt) {
        return jsonResponse({ success: false, error: 'Test attempt not found' }, 404);
      }

      // Calculate score
      const questions = await getCollection('questions');
      const testQuestions = await questions.find({ mockTestId: attempt.mockTestId }).toArray();
      
      let score = 0;
      let correct = 0;
      let incorrect = 0;
      let unanswered = 0;

      testQuestions.forEach(q => {
        const userAnswer = answers[q.id];
        if (userAnswer === undefined || userAnswer === null) {
          unanswered++;
        } else if (userAnswer === q.correct_option_number) {
          score += (q.marks || 2);
          correct++;
        } else {
          score -= (q.negativeMarks || 0.66);
          incorrect++;
        }
      });

      await attempts.updateOne(
        { id: attemptId },
        {
          $set: {
            answers: answers || attempt.answers,
            endTime: new Date(),
            status: 'COMPLETED',
            score: Math.max(0, score),
            correct,
            incorrect,
            unanswered
          }
        }
      );

      return jsonResponse({
        success: true,
        data: {
          attemptId,
          score: Math.max(0, score),
          totalMarks: attempt.totalMarks,
          correct,
          incorrect,
          unanswered
        }
      });
    }

    // Rank Predictor
    if (path === '/rank-predictor') {
      const { examSlug, score, totalMarks } = body;
      
      const percentage = (score / totalMarks) * 100;
      let rankRange = { min: 0, max: 0 };
      let recommendations = [];

      if (percentage >= 90) {
        rankRange = { min: 1, max: 100 };
        recommendations = ['Top IITs', 'IISc Bangalore', 'Top NITs'];
      } else if (percentage >= 80) {
        rankRange = { min: 100, max: 500 };
        recommendations = ['Good NITs', 'Top IIITs', 'State universities'];
      } else if (percentage >= 70) {
        rankRange = { min: 500, max: 2000 };
        recommendations = ['NITs', 'IIITs', 'Good state colleges'];
      } else if (percentage >= 60) {
        rankRange = { min: 2000, max: 5000 };
        recommendations = ['Some NITs', 'State colleges', 'Private universities'];
      } else {
        rankRange = { min: 5000, max: 20000 };
        recommendations = ['State colleges', 'Private colleges'];
      }

      return jsonResponse({
        success: true,
        data: { percentage, rankRange, recommendations }
      });
    }

    // ======= ADMIN ROUTES =======
    if (path.startsWith('/admin')) {
      const user = await getAuthUser(request);
      if (!user || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(user.role)) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }

      // Create Mock Test
      if (path === '/admin/mock-tests') {
        const mockTests = await getCollection('mock_tests');
        
        const testData = {
          id: uuidv4(),
          title: body.title,
          description: body.description || '',
          examId: body.examId || null,
          domainId: body.domainId || null,
          testType: body.testType || 'mock_test', // mock_test, practice_questions, previous_year
          duration: parseInt(body.duration) || 60,
          totalQuestions: 0,
          totalMarks: 0,
          isFree: body.isFree ?? true,
          price: parseInt(body.price) || 0,
          status: body.status || 'Active',
          isPublished: false, // Default to unpublished
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await mockTests.insertOne(testData);
        return jsonResponse({ success: true, data: testData });
      }

      // Publish/Unpublish Mock Test
      if (path === '/admin/mock-tests/publish') {
        const { testId, isPublished } = body;
        const mockTests = await getCollection('mock_tests');
        
        await mockTests.updateOne(
          { id: testId },
          { $set: { isPublished, updatedAt: new Date() } }
        );
        
        return jsonResponse({ success: true, message: isPublished ? 'Test published' : 'Test unpublished' });
      }

      // Save Questions (from CSV preview) - Save Draft or Publish
      if (path === '/admin/questions/save-batch') {
        const { mockTestId, questions: questionsData, publish } = body;
        
        if (!mockTestId || !Array.isArray(questionsData) || questionsData.length === 0) {
          return jsonResponse({ success: false, error: 'mockTestId and questions are required' }, 400);
        }

        const mockTests = await getCollection('mock_tests');
        const test = await mockTests.findOne({ id: mockTestId });
        
        if (!test) {
          return jsonResponse({ success: false, error: 'Mock test not found' }, 404);
        }

        const questions = await getCollection('questions');
        let inserted = 0;
        let duplicates = 0;
        let failed = 0;
        const errors = [];

        for (let i = 0; i < questionsData.length; i++) {
          const q = questionsData[i];
          
          try {
            // Check for duplicate (same mockTestId + question_title)
            const existing = await questions.findOne({
              mockTestId,
              question_title: q.question_title
            });
            
            if (existing) {
              duplicates++;
              continue;
            }

            // Validate required fields
            if (!q.question_title || !q.option1_title || !q.option2_title || !q.option3_title || !q.option4_title) {
              errors.push({ row: i + 1, error: 'Missing required fields' });
              failed++;
              continue;
            }

            const correctOption = parseInt(q.correct_option_number);
            if (isNaN(correctOption) || correctOption < 1 || correctOption > 4) {
              errors.push({ row: i + 1, error: 'correct_option_number must be 1-4' });
              failed++;
              continue;
            }

            // Insert question with mockTestId
            // Normalize status to 'Active' (capitalize first letter)
            let questionStatus = q.status || 'Active';
            if (questionStatus.toLowerCase() === 'active') questionStatus = 'Active';
            if (questionStatus.toLowerCase() === 'inactive') questionStatus = 'Inactive';
            
            await questions.insertOne({
              id: uuidv4(),
              mockTestId: mockTestId,
              questionNumber: inserted + 1,
              test_title: test.title,
              topic_title: q.topic_title || '',
              question_title: q.question_title,
              duration: parseInt(q.duration) || 2,
              description: q.description || '',
              solution_text: q.solution_text || '',
              tip: q.tip || '',
              status: questionStatus,
              option1_title: q.option1_title,
              option2_title: q.option2_title,
              option3_title: q.option3_title,
              option4_title: q.option4_title,
              correct_option_number: correctOption,
              marks: 2,
              negativeMarks: 0.66,
              createdAt: new Date()
            });
            inserted++;
          } catch (err) {
            errors.push({ row: i + 1, error: err.message });
            failed++;
          }
        }

        // Update mock test question count and marks
        const totalQuestions = await questions.countDocuments({ mockTestId });
        await mockTests.updateOne(
          { id: mockTestId },
          { 
            $set: { 
              totalQuestions,
              totalMarks: totalQuestions * 2,
              isPublished: publish === true,
              updatedAt: new Date()
            } 
          }
        );

        return jsonResponse({
          success: true,
          data: {
            total: questionsData.length,
            inserted,
            duplicates,
            failed,
            errors: errors.slice(0, 20),
            testPublished: publish === true
          }
        });
      }

      // Create single question
      if (path === '/admin/questions/create') {
        const { mockTestId } = body;
        
        if (!mockTestId) {
          return jsonResponse({ success: false, error: 'mockTestId is required' }, 400);
        }

        const mockTests = await getCollection('mock_tests');
        const test = await mockTests.findOne({ id: mockTestId });
        
        if (!test) {
          return jsonResponse({ success: false, error: 'Mock test not found' }, 404);
        }

        const questions = await getCollection('questions');
        
        // Check duplicate
        const existing = await questions.findOne({
          mockTestId,
          question_title: body.question_title
        });
        
        if (existing) {
          return jsonResponse({ success: false, error: 'Duplicate question exists' }, 400);
        }

        const count = await questions.countDocuments({ mockTestId });
        
        const questionData = {
          id: uuidv4(),
          mockTestId,
          questionNumber: count + 1,
          test_title: test.title,
          topic_title: body.topic_title || '',
          question_title: body.question_title,
          duration: parseInt(body.duration) || 2,
          description: body.description || '',
          solution_text: body.solution_text || '',
          tip: body.tip || '',
          status: body.status || 'Active',
          option1_title: body.option1_title,
          option2_title: body.option2_title,
          option3_title: body.option3_title,
          option4_title: body.option4_title,
          correct_option_number: parseInt(body.correct_option_number),
          marks: 2,
          negativeMarks: 0.66,
          createdAt: new Date()
        };
        
        await questions.insertOne(questionData);
        
        // Update test count
        await mockTests.updateOne(
          { id: mockTestId },
          { $set: { totalQuestions: count + 1, totalMarks: (count + 1) * 2 } }
        );
        
        return jsonResponse({ success: true, data: questionData });
      }

      // Create Exam
      if (path === '/admin/exams') {
        const examData = {
          id: uuidv4(),
          name: body.name,
          fullName: body.fullName || body.name,
          description: body.description || '',
          category: body.category || 'Engineering',
          icon: body.icon || '📚',
          price: parseInt(body.price) || 0,
          status: body.status || 'Active',
          slug: body.name.toLowerCase().replace(/\s+/g, '-'),
          totalTests: 0,
          totalQuestions: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const exams = await getCollection('exams');
        await exams.insertOne(examData);
        return jsonResponse({ success: true, data: examData });
      }

      // Create Answer Key
      if (path === '/admin/answer-keys') {
        const { title, description, examId, positiveMarks, negativeMarks, answers } = body;
        if (!title || !String(title).trim()) {
          return jsonResponse({ success: false, error: 'Title is required' }, 400);
        }
        const normalizedAnswers = Array.isArray(answers)
          ? answers
              .filter(a => a && a.question_id !== undefined && a.correct_answer !== undefined)
              .map(a => ({
                question_id: normalizeQid(a.question_id),
                // Keep correct_answer raw — classifyCorrect will detect MAT/RANGE/NAT/MSQ/MCQ
                correct_answer: String(a.correct_answer).trim()
              }))
          : [];
        const akData = {
          id: uuidv4(),
          title: String(title).trim(),
          description: description || '',
          examId: examId || null,
          positiveMarks: positiveMarks !== undefined ? parseFloat(positiveMarks) : 1,
          negativeMarks: negativeMarks !== undefined ? parseFloat(negativeMarks) : 0,
          totalQuestions: normalizedAnswers.length,
          answers: normalizedAnswers,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const keys = await getCollection('answer_keys');
        await keys.insertOne(akData);
        return jsonResponse({ success: true, data: akData });
      }

      // Upload CSV for an answer key (replaces answers)
      if (path.match(/^\/admin\/answer-keys\/[^/]+\/upload-csv$/)) {
        const akId = path.split('/')[3];
        const keys = await getCollection('answer_keys');
        const key = await keys.findOne({ id: akId });
        if (!key) return jsonResponse({ success: false, error: 'Answer key not found' }, 404);

        const { csv } = body;
        if (!csv || typeof csv !== 'string') {
          return jsonResponse({ success: false, error: 'CSV content is required' }, 400);
        }

        // RFC4180-ish parser: handle quoted fields with commas
        function parseCsvLine(line) {
          const out = [];
          let i = 0, cur = '', inQ = false;
          while (i < line.length) {
            const ch = line[i];
            if (inQ) {
              if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 2; continue; }
              if (ch === '"') { inQ = false; i++; continue; }
              cur += ch; i++;
            } else {
              if (ch === '"' && cur === '') { inQ = true; i++; continue; }
              if (ch === ',') { out.push(cur); cur = ''; i++; continue; }
              cur += ch; i++;
            }
          }
          out.push(cur);
          return out.map(s => s.trim());
        }

        const lines = csv.replace(/\r/g, '').split('\n').filter(l => l.trim());
        if (lines.length < 1) return jsonResponse({ success: false, error: 'CSV is empty' }, 400);

        const firstCols = parseCsvLine(lines[0]).map(c => c.toLowerCase());
        const hasHeader = firstCols.includes('question_id') || firstCols.includes('correct_answer') || firstCols.includes('answer');
        const startIdx = hasHeader ? 1 : 0;
        let qIdx = hasHeader ? firstCols.indexOf('question_id') : 0;
        let aIdx = hasHeader ? firstCols.findIndex(c => c === 'correct_answer' || c === 'answer') : 1;
        if (qIdx === -1) qIdx = 0;
        if (aIdx === -1) aIdx = 1;

        const answers = [];
        const errors = [];
        const seen = new Set();
        for (let i = startIdx; i < lines.length; i++) {
          const cols = parseCsvLine(lines[i]);
          if (cols.length < 2) continue;
          const qRaw = cols[qIdx] ?? cols[0];
          // If answer column has comma (MSQ) and was not quoted, auto-join remaining columns
          let aRaw = cols[aIdx] ?? cols[1];
          if (!hasHeader && cols.length > 2) {
            aRaw = cols.slice(1).join(',');
          } else if (hasHeader && aIdx !== -1 && cols.length > Math.max(qIdx, aIdx) + 1) {
            // columns after aIdx — join with commas (unquoted MSQ)
            aRaw = cols.slice(aIdx).join(',');
          }
          const qid = normalizeQid(qRaw);
          if (!qid) { errors.push(`Row ${i + 1}: invalid question_id`); continue; }
          if (seen.has(qid)) { errors.push(`Row ${i + 1}: duplicate question_id ${qid}`); continue; }
          seen.add(qid);
          // Don't normalize to letter — keep raw so classifyCorrect can detect MAT/RANGE/NAT/MSQ
          answers.push({ question_id: qid, correct_answer: String(aRaw).trim() });
        }

        await keys.updateOne(
          { id: akId },
          { $set: { answers, totalQuestions: answers.length, updatedAt: new Date() } }
        );
        const updated = await keys.findOne({ id: akId });
        return jsonResponse({
          success: true,
          data: updated,
          stats: { imported: answers.length, errors }
        });
      }

      // Create Job
      if (path === '/admin/jobs') {
        const jobData = {
          id: uuidv4(),
          ...body,
          vacancies: parseInt(body.vacancies) || 0,
          status: body.status || 'Active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const jobs = await getCollection('jobs');
        await jobs.insertOne(jobData);
        return jsonResponse({ success: true, data: jobData });
      }

      // Create College
      if (path === '/admin/colleges') {
        const { name, location } = body;
        if (!name) {
          return jsonResponse({ success: false, error: 'Name is required' }, 400);
        }
        const collegeData = {
          id: uuidv4(),
          name,
          location: location || '',
          ranking: body.ranking !== undefined ? parseInt(body.ranking) : null,
          type: body.type || 'Government',
          courses: Array.isArray(body.courses) ? body.courses
            : (body.courses ? String(body.courses).split(',').map(s => s.trim()).filter(Boolean) : []),
          fees: body.fees || '',
          rating: body.rating !== undefined ? parseFloat(body.rating) : null,
          acceptedExams: Array.isArray(body.acceptedExams) ? body.acceptedExams
            : (body.acceptedExams ? String(body.acceptedExams).split(',').map(s => s.trim()).filter(Boolean) : []),
          description: body.description || '',
          website: body.website || '',
          image: body.image || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const colleges = await getCollection('colleges');
        await colleges.insertOne(collegeData);
        return jsonResponse({ success: true, data: collegeData });
      }

      // Create Domain
      if (path === '/admin/domains') {
        const { examId, name, description, price } = body;
        if (!examId || !name) {
          return jsonResponse({ success: false, error: 'examId and name are required' }, 400);
        }
        
        const domainsCollection = await getCollection('domains');
        const domainData = {
          id: uuidv4(),
          examId,
          name,
          description: description || '',
          price: price || 0,
          status: 'Active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await domainsCollection.insertOne(domainData);
        return jsonResponse({ success: true, data: domainData });
      }

      // Update Domain
      if (path.startsWith('/admin/domains/')) {
        const domainId = path.split('/admin/domains/')[1];
        const domainsCollection = await getCollection('domains');
        
        const { name, description, price, status } = body;
        const updateData = { updatedAt: new Date() };
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = price;
        if (status !== undefined) updateData.status = status;
        
        await domainsCollection.updateOne(
          { id: domainId },
          { $set: updateData }
        );
        
        const updated = await domainsCollection.findOne({ id: domainId });
        return jsonResponse({ success: true, data: updated });
      }

      // Create Blog Post
      if (path === '/admin/blogs') {
        const { title, description, content, image, publishDate, status } = body;
        
        if (!title || !content) {
          return jsonResponse({ success: false, error: 'Title and content are required' }, 400);
        }

        // Generate slug from title
        const slug = title.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        const blogs = await getCollection('blogs');
        
        // Check for duplicate slug
        const existing = await blogs.findOne({ slug });
        const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

        const blogData = {
          id: uuidv4(),
          title,
          slug: finalSlug,
          description: description || '',
          content,
          image: image || null,
          publishDate: publishDate ? new Date(publishDate) : new Date(),
          status: status || 'draft',
          views: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await blogs.insertOne(blogData);
        return jsonResponse({ success: true, data: blogData });
      }

      // Upload single image (base64) - used by blog editor
      if (path === '/admin/upload-image') {
        const { image, filename } = body;
        if (!image) {
          return jsonResponse({ success: false, error: 'Image data is required' }, 400);
        }

        // Parse data URI: "data:image/png;base64,iVBORw0..."
        const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(image);
        if (!match) {
          return jsonResponse({ success: false, error: 'Invalid image data URI' }, 400);
        }
        const mimeType = match[1];
        const base64Data = match[2];

        const imageId = uuidv4();
        const imagesCollection = await getCollection('uploaded_images');
        await imagesCollection.insertOne({
          id: imageId,
          filename: filename || `blog-${imageId}`,
          mimeType,
          data: base64Data,
          size: Math.ceil(base64Data.length * 0.75),
          createdAt: new Date()
        });

        return jsonResponse({
          success: true,
          data: { id: imageId, url: `/api/images/${imageId}` }
        });
      }

      // Create Testimonial
      if (path === '/admin/testimonials') {
        const { name, testimonial } = body;
        if (!name || !testimonial) {
          return jsonResponse({ success: false, error: 'Name and testimonial are required' }, 400);
        }
        const testimonialData = {
          id: uuidv4(),
          name,
          testimonial,
          exam: body.exam || '',
          rank: body.rank || '',
          image: body.image || '',
          rating: body.rating !== undefined && body.rating !== null && body.rating !== ''
            ? parseInt(body.rating) : 5,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const testimonials = await getCollection('testimonials');
        await testimonials.insertOne(testimonialData);
        return jsonResponse({ success: true, data: testimonialData });
      }

      // Bulk Delete Questions
      if (path === '/admin/questions/bulk-delete') {
        const { questionIds, mockTestId } = body;
        
        if (!Array.isArray(questionIds) || questionIds.length === 0) {
          return jsonResponse({ success: false, error: 'questionIds array is required' }, 400);
        }

        const questions = await getCollection('questions');
        
        // Delete all selected questions
        const result = await questions.deleteMany({ 
          id: { $in: questionIds } 
        });
        
        // Update mock test question count if mockTestId provided
        if (mockTestId) {
          const mockTests = await getCollection('mock_tests');
          const count = await questions.countDocuments({ mockTestId });
          await mockTests.updateOne(
            { id: mockTestId },
            { $set: { totalQuestions: count, totalMarks: count * 2 } }
          );
        }
        
        return jsonResponse({ 
          success: true, 
          message: `Deleted ${result.deletedCount} questions`,
          deletedCount: result.deletedCount
        });
      }
    }

    return jsonResponse({ success: false, error: 'Endpoint not found' }, 404);
  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

// PUT Requests Handler
export async function PUT(request) {
  const path = getPath(request);

  try {
    const body = await request.json();
    const user = await getAuthUser(request);

    // Update Profile
    if (path === '/profile') {
      if (!user) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }
      const { name, phone } = body;
      const users = await getCollection('users');
      await users.updateOne(
        { id: user.id },
        { $set: { name, phone, updatedAt: new Date() } }
      );
      return jsonResponse({ success: true, message: 'Profile updated' });
    }

    // Admin routes
    if (path.startsWith('/admin')) {
      if (!user || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(user.role)) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }

      // Update Mock Test
      if (path.startsWith('/admin/mock-tests/')) {
        const testId = path.split('/admin/mock-tests/')[1];
        const mockTests = await getCollection('mock_tests');
        await mockTests.updateOne(
          { id: testId },
          { $set: { ...body, updatedAt: new Date() } }
        );
        return jsonResponse({ success: true, message: 'Mock test updated' });
      }

      // Update Question
      if (path.startsWith('/admin/questions/')) {
        const questionId = path.split('/admin/questions/')[1];
        const questions = await getCollection('questions');
        await questions.updateOne(
          { id: questionId },
          { $set: { ...body, updatedAt: new Date() } }
        );
        return jsonResponse({ success: true, message: 'Question updated' });
      }

      // Update Exam
      if (path.startsWith('/admin/exams/')) {
        const examId = path.split('/admin/exams/')[1];
        const exams = await getCollection('exams');
        await exams.updateOne(
          { id: examId },
          { $set: { ...body, updatedAt: new Date() } }
        );
        return jsonResponse({ success: true, message: 'Exam updated' });
      }

      // Update Job
      if (path.startsWith('/admin/jobs/')) {
        const jobId = path.split('/admin/jobs/')[1];
        const jobs = await getCollection('jobs');
        const updateData = { ...body, updatedAt: new Date() };
        if (body.vacancies !== undefined) updateData.vacancies = parseInt(body.vacancies) || 0;
        await jobs.updateOne(
          { id: jobId },
          { $set: updateData }
        );
        const updated = await jobs.findOne({ id: jobId });
        return jsonResponse({ success: true, data: updated });
      }

      // Update College
      if (path.startsWith('/admin/colleges/')) {
        const collegeId = path.split('/admin/colleges/')[1];
        const colleges = await getCollection('colleges');
        const updateData = { updatedAt: new Date() };
        const allowed = ['name', 'location', 'type', 'fees', 'description', 'website', 'image'];
        allowed.forEach(k => { if (body[k] !== undefined) updateData[k] = body[k]; });
        if (body.ranking !== undefined) updateData.ranking = body.ranking !== null && body.ranking !== '' ? parseInt(body.ranking) : null;
        if (body.rating !== undefined) updateData.rating = body.rating !== null && body.rating !== '' ? parseFloat(body.rating) : null;
        if (body.courses !== undefined) {
          updateData.courses = Array.isArray(body.courses) ? body.courses
            : (body.courses ? String(body.courses).split(',').map(s => s.trim()).filter(Boolean) : []);
        }
        if (body.acceptedExams !== undefined) {
          updateData.acceptedExams = Array.isArray(body.acceptedExams) ? body.acceptedExams
            : (body.acceptedExams ? String(body.acceptedExams).split(',').map(s => s.trim()).filter(Boolean) : []);
        }
        const r = await colleges.updateOne({ id: collegeId }, { $set: updateData });
        if (r.matchedCount === 0) return jsonResponse({ success: false, error: 'College not found' }, 404);
        const updated = await colleges.findOne({ id: collegeId });
        return jsonResponse({ success: true, data: updated });
      }

      // Update Testimonial
      if (path.startsWith('/admin/testimonials/')) {
        const tid = path.split('/admin/testimonials/')[1];
        const testimonials = await getCollection('testimonials');
        const updateData = { updatedAt: new Date() };
        const allowed = ['name', 'testimonial', 'exam', 'rank', 'image'];
        allowed.forEach(k => { if (body[k] !== undefined) updateData[k] = body[k]; });
        if (body.rating !== undefined) updateData.rating = parseInt(body.rating) || 5;
        const r = await testimonials.updateOne({ id: tid }, { $set: updateData });
        if (r.matchedCount === 0) return jsonResponse({ success: false, error: 'Testimonial not found' }, 404);
        const updated = await testimonials.findOne({ id: tid });
        return jsonResponse({ success: true, data: updated });
      }

      // Update Contact Lead
      if (path.startsWith('/admin/contacts/')) {
        const cid = path.split('/admin/contacts/')[1];
        const contacts = await getCollection('contact_leads');
        const updateData = { updatedAt: new Date() };
        const allowed = ['name', 'email', 'phone', 'subject', 'message', 'status', 'notes'];
        allowed.forEach(k => { if (body[k] !== undefined) updateData[k] = body[k]; });
        const r = await contacts.updateOne({ id: cid }, { $set: updateData });
        if (r.matchedCount === 0) return jsonResponse({ success: false, error: 'Contact lead not found' }, 404);
        const updated = await contacts.findOne({ id: cid });
        return jsonResponse({ success: true, data: updated });
      }

      // Update Answer Key
      if (path.startsWith('/admin/answer-keys/')) {
        const akId = path.split('/admin/answer-keys/')[1];
        const keys = await getCollection('answer_keys');
        const updateData = { updatedAt: new Date() };
        if (body.title !== undefined) updateData.title = String(body.title).trim();
        if (body.description !== undefined) updateData.description = body.description;
        if (body.examId !== undefined) updateData.examId = body.examId || null;
        if (body.positiveMarks !== undefined) updateData.positiveMarks = parseFloat(body.positiveMarks);
        if (body.negativeMarks !== undefined) updateData.negativeMarks = parseFloat(body.negativeMarks);
        if (body.status !== undefined) updateData.status = body.status;
        if (Array.isArray(body.answers)) {
          const normalized = body.answers
            .filter(a => a && a.question_id !== undefined && a.correct_answer !== undefined)
            .map(a => ({
              question_id: normalizeQid(a.question_id),
              // Keep raw — classifyCorrect will detect MAT/RANGE/NAT/MSQ/MCQ
              correct_answer: String(a.correct_answer).trim()
            }));
          updateData.answers = normalized;
          updateData.totalQuestions = normalized.length;
        }
        const r = await keys.updateOne({ id: akId }, { $set: updateData });
        if (r.matchedCount === 0) return jsonResponse({ success: false, error: 'Answer key not found' }, 404);
        const updated = await keys.findOne({ id: akId });
        return jsonResponse({ success: true, data: updated });
      }

      // Update Blog Post
      if (path.startsWith('/admin/blogs/')) {
        const blogId = path.split('/admin/blogs/')[1];
        const blogs = await getCollection('blogs');

        const { title, description, content, image, publishDate, status, pdfPermission } = body;
        const updateData = { updatedAt: new Date() };

        if (title !== undefined) {
          updateData.title = title;
          // Regenerate slug if title changed (avoid collision with other blog)
          const baseSlug = title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          const existing = await blogs.findOne({ slug: baseSlug, id: { $ne: blogId } });
          updateData.slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;
        }
        if (description !== undefined) updateData.description = description;
        if (content !== undefined) updateData.content = content;
        if (image !== undefined) updateData.image = image;
        if (publishDate !== undefined) updateData.publishDate = new Date(publishDate);
        if (status !== undefined) updateData.status = status;
        if (pdfPermission !== undefined) {
          // Only allow two values; anything else ignored
          if (pdfPermission === 'view' || pdfPermission === 'view_download') {
            updateData.pdfPermission = pdfPermission;
          }
        }

        const result = await blogs.updateOne({ id: blogId }, { $set: updateData });
        if (result.matchedCount === 0) {
          return jsonResponse({ success: false, error: 'Blog not found' }, 404);
        }
        const updated = await blogs.findOne({ id: blogId });
        return jsonResponse({ success: true, data: updated });
      }
    }

    return jsonResponse({ success: false, error: 'Endpoint not found' }, 404);
  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

// DELETE Requests Handler
export async function DELETE(request) {
  const path = getPath(request);

  try {
    const user = await getAuthUser(request);

    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    // Delete Mock Test (also delete its questions)
    if (path.startsWith('/admin/mock-tests/')) {
      const testId = path.split('/admin/mock-tests/')[1];
      const mockTests = await getCollection('mock_tests');
      const questions = await getCollection('questions');
      
      await mockTests.deleteOne({ id: testId });
      await questions.deleteMany({ mockTestId: testId });
      
      return jsonResponse({ success: true, message: 'Mock test and questions deleted' });
    }

    // Delete Blog Post
    if (path.startsWith('/admin/blogs/')) {
      const blogId = path.split('/admin/blogs/')[1];
      const blogs = await getCollection('blogs');
      const blog = await blogs.findOne({ id: blogId });

      // Clean up any GridFS PDF files associated with this blog
      if (blog && (blog.pdfFileId || blog.pdfPreviewFileId)) {
        try {
          const { ObjectId } = require('mongodb');
          const { getPdfBucket } = require('@/lib/db');
          const bucket = await getPdfBucket('pdfs');
          for (const fid of [blog.pdfFileId, blog.pdfPreviewFileId]) {
            if (fid) {
              try { await bucket.delete(new ObjectId(fid)); } catch (_) {}
            }
          }
        } catch (e) {
          console.error('PDF cleanup error on blog delete:', e);
        }
      }

      await blogs.deleteOne({ id: blogId });
      return jsonResponse({ success: true, message: 'Blog deleted' });
    }

    // Delete Question
    if (path.startsWith('/admin/questions/')) {
      const questionId = path.split('/admin/questions/')[1];
      const questions = await getCollection('questions');
      const question = await questions.findOne({ id: questionId });
      
      if (question) {
        await questions.deleteOne({ id: questionId });
        
        // Update test count
        const mockTests = await getCollection('mock_tests');
        const count = await questions.countDocuments({ mockTestId: question.mockTestId });
        await mockTests.updateOne(
          { id: question.mockTestId },
          { $set: { totalQuestions: count, totalMarks: count * 2 } }
        );
      }
      
      return jsonResponse({ success: true, message: 'Question deleted' });
    }

    // Delete Exam
    if (path.startsWith('/admin/exams/')) {
      const examId = path.split('/admin/exams/')[1];
      const exams = await getCollection('exams');
      await exams.deleteOne({ id: examId });
      return jsonResponse({ success: true, message: 'Exam deleted' });
    }

    // Delete Domain (also reassign tests to General or delete them)
    if (path.startsWith('/admin/domains/')) {
      const domainId = path.split('/admin/domains/')[1];
      const domainsCollection = await getCollection('domains');
      const mockTests = await getCollection('mock_tests');
      
      // Move tests to no domain or delete them
      await mockTests.updateMany(
        { domainId: domainId },
        { $unset: { domainId: '' } }
      );
      
      await domainsCollection.deleteOne({ id: domainId });
      return jsonResponse({ success: true, message: 'Domain deleted' });
    }

    // Delete Job
    if (path.startsWith('/admin/jobs/')) {
      const jobId = path.split('/admin/jobs/')[1];
      const jobs = await getCollection('jobs');
      await jobs.deleteOne({ id: jobId });
      return jsonResponse({ success: true, message: 'Job deleted' });
    }

    // Delete Testimonial
    if (path.startsWith('/admin/testimonials/')) {
      const testimonialId = path.split('/admin/testimonials/')[1];
      const testimonials = await getCollection('testimonials');
      await testimonials.deleteOne({ id: testimonialId });
      return jsonResponse({ success: true, message: 'Testimonial deleted' });
    }

    // Delete College
    if (path.startsWith('/admin/colleges/')) {
      const collegeId = path.split('/admin/colleges/')[1];
      const colleges = await getCollection('colleges');
      await colleges.deleteOne({ id: collegeId });
      return jsonResponse({ success: true, message: 'College deleted' });
    }

    // Delete Contact Lead
    if (path.startsWith('/admin/contacts/')) {
      const contactId = path.split('/admin/contacts/')[1];
      const contacts = await getCollection('contact_leads');
      await contacts.deleteOne({ id: contactId });
      return jsonResponse({ success: true, message: 'Contact lead deleted' });
    }

    // Delete Answer Key (and associated rank predictions)
    if (path.startsWith('/admin/answer-keys/')) {
      const akId = path.split('/admin/answer-keys/')[1];
      const keys = await getCollection('answer_keys');
      const predictions = await getCollection('rank_predictions');
      await keys.deleteOne({ id: akId });
      const delRes = await predictions.deleteMany({ answerKeyId: akId });
      return jsonResponse({ success: true, message: `Answer key deleted (${delRes.deletedCount} associated submissions removed)` });
    }

    return jsonResponse({ success: false, error: 'Endpoint not found' }, 404);
  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}
