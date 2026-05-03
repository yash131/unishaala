import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCollection, getPdfBucket } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25MB

async function assertAdmin(request) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  const user = await getUserFromToken(token);
  if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) return null;
  return user;
}

function uploadBufferToGridFS(bucket, buffer, filename, contentType, metadata = {}) {
  return new Promise((resolve, reject) => {
    const upload = bucket.openUploadStream(filename, { contentType, metadata });
    upload.on('error', reject);
    upload.on('finish', () => resolve(upload.id));
    upload.end(buffer);
  });
}

// GET: list all Blog PDF library entries
export async function GET(request) {
  try {
    const admin = await assertAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const col = await getCollection('blog_pdfs');
    const items = await col.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, data: items });
  } catch (e) {
    console.error('List blog PDFs error:', e);
    return NextResponse.json({ success: false, error: e.message || 'Failed' }, { status: 500 });
  }
}

// POST: upload a new PDF to the library (multipart form: pdf, label)
export async function POST(request) {
  try {
    const admin = await assertAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get('pdf');
    const label = (form.get('label') || '').toString().trim();

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No PDF file provided' }, { status: 400 });
    }
    if (!label) {
      return NextResponse.json({ success: false, error: 'Button label is required' }, { status: 400 });
    }
    if (file.type && !/pdf/i.test(file.type) && !/\.pdf$/i.test(file.name || '')) {
      return NextResponse.json({ success: false, error: 'File must be a PDF' }, { status: 400 });
    }
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { success: false, error: `PDF too large (max ${MAX_PDF_BYTES / 1024 / 1024} MB)` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    const originalName = (file.name || 'document.pdf').replace(/[^\w.\-() ]+/g, '_');

    const bucket = await getPdfBucket('pdfs');
    const fileId = await uploadBufferToGridFS(bucket, buf, originalName, 'application/pdf', {
      kind: 'blog_library',
      label,
    });

    const doc = {
      id: uuidv4(),
      label,
      fileName: originalName,
      fileId: String(fileId),
      size: buf.length,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: admin.id,
    };
    const col = await getCollection('blog_pdfs');
    await col.insertOne(doc);

    return NextResponse.json({ success: true, data: doc });
  } catch (e) {
    console.error('Upload blog PDF error:', e);
    return NextResponse.json({ success: false, error: e.message || 'Upload failed' }, { status: 500 });
  }
}
