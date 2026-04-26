import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase, getCollection } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { parse } from 'csv-parse/sync';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

// CSV column mappings
const OLD_FORMAT_COLUMNS = [
  'test_title', 'topic_title', 'question_number', 'question_text', 'duration',
  'description', 'solution_text', 'tip', 'status', 'option1_title', 'option2_title',
  'option3_title', 'option4_title', 'correct_option_number'
];

const NEW_FORMAT_COLUMNS = [
  'test_title', 'topic_title', 'question_number', 'question_text', 'question_image',
  'duration', 'description', 'solution_text', 'tip', 'status',
  'option1_title', 'option1_image', 'option2_title', 'option2_image',
  'option3_title', 'option3_image', 'option4_title', 'option4_image',
  'correct_option_number'
];

const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB

// URL helpers --------------------------------------------------------------
const isHttpUrl = (s) => {
  if (!s || typeof s !== 'string') return false;
  const t = s.trim();
  return /^https?:\/\//i.test(t);
};

const looksLikeImageUrl = (s) => {
  if (!isHttpUrl(s)) return false;
  // Quick accept on file extensions or common CDN/object storage hosts
  return /\.(png|jpe?g|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(s) ||
         /(bunny|b-cdn|cloudfront|cloudinary|imgix|amazonaws|gstatic|googleusercontent|theclosedoor)/i.test(s);
};

/**
 * Validate an external image URL via HEAD request.
 * Falls back to GET (range 0-0) if HEAD is not supported by the host.
 * Returns { ok: boolean, status?: number, contentType?: string, error?: string }
 */
async function validateImageUrl(url, { timeoutMs = 5000 } = {}) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' });
    } catch (_e) {
      res = null;
    }
    if (!res || res.status === 405 || res.status === 501) {
      // Fallback: small GET
      res = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: ctrl.signal,
        redirect: 'follow'
      });
    }
    clearTimeout(t);
    const ct = res.headers.get('content-type') || '';
    if (!res.ok && res.status !== 206) {
      return { ok: false, status: res.status, contentType: ct, error: `HTTP ${res.status}` };
    }
    if (ct && !ct.toLowerCase().startsWith('image/')) {
      return { ok: false, status: res.status, contentType: ct, error: `not an image (content-type: ${ct})` };
    }
    return { ok: true, status: res.status, contentType: ct };
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'timeout' : (e.message || 'fetch failed') };
  }
}

/** Validate many URLs in parallel batches. Returns Map<url, result>. */
async function validateUrlsInBatches(urls, { batchSize = 10, timeoutMs = 5000 } = {}) {
  const map = new Map();
  const unique = Array.from(new Set(urls.filter((u) => isHttpUrl(u))));
  for (let i = 0; i < unique.length; i += batchSize) {
    const slice = unique.slice(i, i + batchSize);
    const results = await Promise.all(slice.map((u) => validateImageUrl(u, { timeoutMs })));
    slice.forEach((u, idx) => map.set(u, results[idx]));
  }
  return map;
}
// --------------------------------------------------------------------------

export async function POST(request) {
  const result = {
    success: false,
    total_rows: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    missing_images: [],
    invalid_image_urls: [],
    invalid_rows: [],
    error: null
  };

  try {
    // Auth check
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ ...result, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ ...result, error: 'Admin access required' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const testId = formData.get('test_id');
    const csvFile = formData.get('csv_file');
    const imagesZip = formData.get('images_zip');
    const publish = formData.get('publish') === 'true';
    // When 'replace' (default true) all existing questions for this testId
    // are wiped first so re-uploading the same CSV is fully idempotent.
    const replaceExisting = formData.get('replace_existing') !== 'false';

    if (!testId) {
      return NextResponse.json({ ...result, error: 'Test ID is required' }, { status: 400 });
    }

    if (!csvFile) {
      return NextResponse.json({ ...result, error: 'CSV file is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Get test details
    const mockTests = await getCollection('mock_tests');
    const test = await mockTests.findOne({ id: testId });
    if (!test) {
      return NextResponse.json({ ...result, error: 'Test not found' }, { status: 404 });
    }

    // STEP 1: Parse CSV
    const csvText = await csvFile.text();
    let records;
    try {
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      });
    } catch (e) {
      return NextResponse.json({ ...result, error: `Invalid CSV format: ${e.message}` }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ ...result, error: 'CSV file is empty' }, { status: 400 });
    }

    result.total_rows = records.length;

    // Detect format by checking for image columns
    const headers = Object.keys(records[0]).map(h => h.toLowerCase().trim());
    const hasImageColumns = headers.some(h => h.includes('image'));

    // Detect URL-mode: any image cell contains an http(s) URL
    const sampleSize = Math.min(records.length, 25);
    let urlMode = false;
    if (hasImageColumns) {
      outer: for (let i = 0; i < sampleSize; i++) {
        const r = records[i];
        for (const k of Object.keys(r)) {
          if (k.toLowerCase().includes('image') && isHttpUrl(r[k])) {
            urlMode = true;
            break outer;
          }
        }
      }
    }

    console.log('CSV Format:', hasImageColumns ? 'NEW (with images)' : 'OLD (no images)', urlMode ? '[URL mode]' : '[ZIP mode]');
    console.log('Headers:', headers);

    // STEP 2a: Validate URLs (URL mode) ------------------------------------
    const urlValidation = new Map(); // url -> { ok, error }
    if (hasImageColumns && urlMode) {
      const allUrls = [];
      for (const r of records) {
        for (const k of Object.keys(r)) {
          if (k.toLowerCase().includes('image') && isHttpUrl(r[k])) {
            allUrls.push(r[k].trim());
          }
        }
      }
      const validated = await validateUrlsInBatches(allUrls, { batchSize: 10, timeoutMs: 6000 });
      for (const [u, v] of validated.entries()) urlValidation.set(u, v);
    }

    // STEP 2b: Process ZIP if uploaded - Store images in MongoDB
    let imageMap = {};
    if (imagesZip && imagesZip.size > 0) {
      if (imagesZip.size > MAX_ZIP_SIZE) {
        return NextResponse.json({ ...result, error: 'ZIP file too large (max 100MB)' }, { status: 400 });
      }

      try {
        const zipBuffer = Buffer.from(await imagesZip.arrayBuffer());
        const zip = new AdmZip(zipBuffer);
        const entries = zip.getEntries();

        // Get the images collection to store images in MongoDB
        const imagesCollection = await getCollection('uploaded_images');

        for (const entry of entries) {
          // Skip directories and system files
          if (entry.isDirectory) continue;
          if (entry.entryName.startsWith('__MACOSX')) continue;
          if (entry.entryName.startsWith('.')) continue;
          if (path.basename(entry.entryName).startsWith('.')) continue;

          const fileName = path.basename(entry.entryName);
          const ext = path.extname(fileName).toLowerCase();

          // Only process allowed image formats
          if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) continue;

          // Generate unique ID for the image
          const imageId = uuidv4();
          const imageData = entry.getData();
          
          // Determine MIME type
          const mimeType = ext === '.png' ? 'image/png' 
            : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
            : ext === '.webp' ? 'image/webp' 
            : 'image/png';

          // Store image in MongoDB
          await imagesCollection.updateOne(
            { id: imageId },
            { 
              $set: {
                id: imageId,
                filename: fileName,
                mimeType: mimeType,
                data: imageData.toString('base64'),
                size: imageData.length,
                createdAt: new Date()
              }
            },
            { upsert: true }
          );

          // Map original filename to API URL
          const publicUrl = `/api/images/${imageId}`;
          
          // Map with full path from ZIP
          imageMap[entry.entryName.toLowerCase()] = publicUrl;
          
          // Map with just filename
          imageMap[fileName.toLowerCase()] = publicUrl;
          
          // Map without extension
          const nameWithoutExt = path.basename(fileName, ext).toLowerCase();
          imageMap[nameWithoutExt] = publicUrl;
          
          // Also map relative path variations (e.g., image/fdg.png -> fdg.png)
          const parts = entry.entryName.split('/');
          if (parts.length > 1) {
            imageMap[parts[parts.length - 1].toLowerCase()] = publicUrl;
          }
          
          console.log(`Stored image in DB: ${fileName} -> ${publicUrl}`);
        }

        console.log('Extracted images:', Object.keys(imageMap).length);
      } catch (e) {
        console.error('ZIP processing error:', e);
        return NextResponse.json({ ...result, error: `ZIP processing failed: ${e.message}` }, { status: 400 });
      }
    }

    // STEP 3 & 4: Process records and save to DB
    const questions = await getCollection('questions');

    // Match BOTH legacy (mockTestId only) and current (test_id) docs so we don't
    // create duplicate question_numbers when re-importing into a test that
    // already has questions inserted via a different code path.
    const testMatch = { $or: [{ test_id: testId }, { mockTestId: testId }] };

    // REPLACE mode: wipe all existing questions for this test so re-uploading
    // the same CSV is idempotent (no duplicates, no stale rows). This is the
    // default behavior — pass replace_existing=false in the form to APPEND.
    let wipedCount = 0;
    if (replaceExisting) {
      const del = await questions.deleteMany(testMatch);
      wipedCount = del.deletedCount || 0;
      console.log(`Replace mode: wiped ${wipedCount} existing questions for test ${testId}`);
    }
    result.replaced = wipedCount;

    // Detect whether the CSV provides its own question_number column. When it
    // does NOT, we assign question numbers by ROW INDEX (1-based) so the same
    // CSV always maps to the same numbers — no drift across re-uploads.
    const csvHasQuestionNumber = headers.includes('question_number');

    // Track used question numbers to detect duplicates
    const usedQuestionNumbers = new Set();
    // Get existing max question number for this test (across both id fields).
    // Only relevant in APPEND mode (replaceExisting=false) — in REPLACE mode the
    // collection was just wiped so max is 0.
    const maxExisting = replaceExisting
      ? null
      : (await questions.find(testMatch).sort({ question_number: -1 }).limit(1).toArray())[0];
    let nextQuestionNumber = (maxExisting?.question_number || 0) + 1;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // +2 for 1-indexed + header row

      try {
        // Normalize column names
        const normalizedRow = {};
        for (const [key, value] of Object.entries(row)) {
          normalizedRow[key.toLowerCase().trim()] = value;
        }

        // Determine question_number:
        //  - if CSV provides one and it's valid + unused, use it
        //  - if CSV has no question_number column, assign by row index (i+1)
        //    so re-importing the same CSV maps to the same numbers
        //  - otherwise auto-assign from nextQuestionNumber++
        let questionNumber = parseInt(normalizedRow['question_number']);
        const questionText = normalizedRow['question_title']?.trim() || normalizedRow['question_text']?.trim();
        const option1Title = normalizedRow['option1_title']?.trim();
        const option2Title = normalizedRow['option2_title']?.trim();
        const option3Title = normalizedRow['option3_title']?.trim();
        const option4Title = normalizedRow['option4_title']?.trim();
        const correctOption = parseInt(normalizedRow['correct_option_number']);

        if (!csvHasQuestionNumber) {
          // CSV doesn't carry question_number — use stable row-based number
          questionNumber = i + 1;
        } else if (!questionNumber || isNaN(questionNumber) || usedQuestionNumbers.has(questionNumber)) {
          // CSV had a column but this row's value is missing or duplicate
          questionNumber = nextQuestionNumber++;
          console.log(`Row ${rowNum}: Assigned new question_number ${questionNumber} (was duplicate or invalid)`);
        }
        usedQuestionNumbers.add(questionNumber);

        // Validation
        const errors = [];
        if (!questionText) errors.push('missing question_text');
        if (!option1Title) errors.push('missing option1_title');
        if (!option2Title) errors.push('missing option2_title');
        if (!option3Title) errors.push('missing option3_title');
        if (!option4Title) errors.push('missing option4_title');
        if (!correctOption || correctOption < 1 || correctOption > 4) errors.push('correct_option_number must be 1-4');

        if (errors.length > 0) {
          result.invalid_rows.push({ row: rowNum, errors });
          result.skipped++;
          continue;
        }

        // Process image URLs (supports both URL mode and ZIP-filename mode)
        let questionImageUrl = null;
        let option1ImageUrl = null;
        let option2ImageUrl = null;
        let option3ImageUrl = null;
        let option4ImageUrl = null;
        let solutionImageUrl = null;

        // Helper: resolve a single image cell into a URL or null,
        // recording validation issues on the result object.
        const resolveImageCell = (cellRaw, fieldName) => {
          const cell = (cellRaw || '').toString().trim();
          if (!cell) return null;

          // URL mode: cell is an http(s) URL
          if (isHttpUrl(cell)) {
            const v = urlValidation.get(cell);
            if (v && !v.ok) {
              result.invalid_image_urls.push({
                row: rowNum,
                field: fieldName,
                url: cell,
                error: v.error || 'invalid'
              });
              return null;
            }
            return cell;
          }

          // ZIP/filename mode: try mapping
          if (Object.keys(imageMap).length > 0) {
            const mapped =
              imageMap[cell.toLowerCase()] ||
              imageMap[path.basename(cell, path.extname(cell)).toLowerCase()];
            if (mapped) return mapped;
            result.missing_images.push({ row: rowNum, field: fieldName, filename: cell });
            return null;
          }

          // Filename given but no ZIP available -> missing
          result.missing_images.push({ row: rowNum, field: fieldName, filename: cell });
          return null;
        };

        if (hasImageColumns) {
          questionImageUrl = resolveImageCell(normalizedRow['question_image'], 'question_image');
          option1ImageUrl  = resolveImageCell(normalizedRow['option1_image'],  'option1_image');
          option2ImageUrl  = resolveImageCell(normalizedRow['option2_image'],  'option2_image');
          option3ImageUrl  = resolveImageCell(normalizedRow['option3_image'],  'option3_image');
          option4ImageUrl  = resolveImageCell(normalizedRow['option4_image'],  'option4_image');
          solutionImageUrl = resolveImageCell(normalizedRow['solution_image'], 'solution_image');
        }

        // Build question document
        const questionDoc = {
          test_id: testId,
          mockTestId: testId, // Also set mockTestId for user-facing queries
          test_title: normalizedRow['test_title']?.trim()
            || normalizedRow['paper_title']?.trim()
            || test.title,
          topic_title: normalizedRow['topic_title']?.trim() || '',
          question_number: questionNumber,
          question_text: questionText,
          question_image_url: questionImageUrl,
          duration: parseInt(normalizedRow['duration']) || 60,
          description: normalizedRow['description']?.trim() || '',
          solution_text: normalizedRow['solution_text']?.trim() || '',
          solution_image_url: solutionImageUrl,
          tip: normalizedRow['tip']?.trim() || '',
          status: 'active', // Always set to active for visibility
          options: [
            { number: 1, title: option1Title, image_url: option1ImageUrl },
            { number: 2, title: option2Title, image_url: option2ImageUrl },
            { number: 3, title: option3Title, image_url: option3ImageUrl },
            { number: 4, title: option4Title, image_url: option4ImageUrl }
          ],
          correct_option_number: correctOption,
          updatedAt: new Date()
        };

        // Upsert by (test_id OR mockTestId) + question_number so legacy docs
        // (that only have mockTestId set) are updated instead of duplicated.
        const existingQuestion = await questions.findOne({
          ...testMatch,
          question_number: questionNumber
        });

        if (existingQuestion) {
          await questions.updateOne(
            { id: existingQuestion.id },
            { $set: questionDoc }
          );
          result.updated++;
        } else {
          await questions.insertOne({
            id: uuidv4(),
            ...questionDoc,
            createdAt: new Date()
          });
          result.imported++;
        }

      } catch (e) {
        console.error(`Error processing row ${rowNum}:`, e);
        result.invalid_rows.push({ row: rowNum, errors: [e.message] });
        result.skipped++;
      }
    }

    // Update test question count and publish status
    const totalQuestions = await questions.countDocuments(testMatch);
    const updateData = { totalQuestions, updatedAt: new Date() };
    if (publish) {
      updateData.isPublished = true;
      updateData.status = 'Active'; // Required for user-facing visibility
    }
    await mockTests.updateOne(
      { id: testId },
      { $set: updateData }
    );

    result.success = true;
    result.published = publish;
    return NextResponse.json(result);

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ ...result, error: error.message }, { status: 500 });
  }
}
