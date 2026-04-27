import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, getPdfBucket } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { extractFirstPage } from '@/lib/pdfUtils';

export const dynamic = 'force-dynamic';

// Max PDF size 25MB for upload
const MAX_PDF_BYTES = 25 * 1024 * 1024;

async function assertAdmin(request) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  const user = await getUserFromToken(token);
  if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) return null;
  return user;
}

async function uploadBufferToGridFS(bucket, buffer, filename, contentType, metadata = {}) {
  return await new Promise((resolve, reject) => {
    const upload = bucket.openUploadStream(filename, { contentType, metadata });
    upload.on('error', reject);
    upload.on('finish', () => resolve(upload.id));
    upload.end(buffer);
  });
}

async function safeDeleteGridFSFile(bucket, idStr) {
  if (!idStr) return;
  try {
    await bucket.delete(new ObjectId(idStr));
  } catch (_e) {
    // ignore — may already be deleted
  }
}

// POST: upload/replace PDF for a job
export async function POST(request, { params }) {
  try {
    const admin = await assertAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id: jobId } = params;
    const jobs = await getCollection('jobs');
    const job = await jobs.findOne({ id: jobId });
    if (!job) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Expected multipart/form-data upload' },
        { status: 400 }
      );
    }

    const form = await request.formData();
    const file = form.get('pdf');
    const permission = (form.get('permission') || 'view').toString();

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No PDF file provided' }, { status: 400 });
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

    const allowedPerms = new Set(['view', 'view_download']);
    const pdfPermission = allowedPerms.has(permission) ? permission : 'view';

    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Extract first page for preview
    let previewBytes;
    let pageCount = 1;
    try {
      const info = await extractFirstPage(pdfBuffer);
      previewBytes = info.previewBytes;
      pageCount = info.pageCount;
    } catch (err) {
      console.error('Preview extraction failed:', err);
      return NextResponse.json(
        { success: false, error: 'Invalid or corrupt PDF file' },
        { status: 400 }
      );
    }

    const bucket = await getPdfBucket('pdfs');

    // Clean up previous files if any
    await safeDeleteGridFSFile(bucket, job.pdfFileId);
    await safeDeleteGridFSFile(bucket, job.pdfPreviewFileId);

    const origFilename = (file.name || `job-${jobId}.pdf`).replace(/[^\w.\-() ]+/g, '_');

    const fullId = await uploadBufferToGridFS(bucket, pdfBuffer, origFilename, 'application/pdf', {
      jobId,
      kind: 'full',
      pages: pageCount,
    });
    const previewId = await uploadBufferToGridFS(
      bucket,
      previewBytes,
      `preview-${origFilename}`,
      'application/pdf',
      { jobId, kind: 'preview', parentFileId: String(fullId) }
    );

    const update = {
      pdfFileId: String(fullId),
      pdfPreviewFileId: String(previewId),
      pdfFileName: origFilename,
      pdfSize: pdfBuffer.length,
      pdfPageCount: pageCount,
      pdfPermission,
      pdfUploadedAt: new Date(),
      updatedAt: new Date(),
    };
    await jobs.updateOne({ id: jobId }, { $set: update });

    const updated = await jobs.findOne({ id: jobId });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Job PDF upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// DELETE: remove the PDF attached to a job
export async function DELETE(request, { params }) {
  try {
    const admin = await assertAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id: jobId } = params;
    const jobs = await getCollection('jobs');
    const job = await jobs.findOne({ id: jobId });
    if (!job) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });

    const bucket = await getPdfBucket('pdfs');
    await safeDeleteGridFSFile(bucket, job.pdfFileId);
    await safeDeleteGridFSFile(bucket, job.pdfPreviewFileId);

    await jobs.updateOne(
      { id: jobId },
      {
        $unset: {
          pdfFileId: '',
          pdfPreviewFileId: '',
          pdfFileName: '',
          pdfSize: '',
          pdfPageCount: '',
          pdfUploadedAt: '',
        },
        $set: { pdfPermission: null, updatedAt: new Date() },
      }
    );
    const updated = await jobs.findOne({ id: jobId });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Job PDF delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}
