import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, getPdfBucket } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

/**
 * Look up the owner document (blog or job) that references a given GridFS file id
 * (either as the full pdfFileId or the pdfPreviewFileId).
 *
 * Returns: { doc, kind: 'blog' | 'job' } or null.
 */
async function findOwnerForFile(fileIdStr) {
  const blogs = await getCollection('blogs');
  const blog = await blogs.findOne({
    $or: [{ pdfFileId: fileIdStr }, { pdfPreviewFileId: fileIdStr }],
  });
  if (blog) return { doc: blog, kind: 'blog' };

  const jobs = await getCollection('jobs');
  const job = await jobs.findOne({
    $or: [{ pdfFileId: fileIdStr }, { pdfPreviewFileId: fileIdStr }],
  });
  if (job) return { doc: job, kind: 'job' };

  const notes = await getCollection('notes');
  const note = await notes.findOne({
    $or: [{ pdfFileId: fileIdStr }, { pdfPreviewFileId: fileIdStr }],
  });
  if (note) return { doc: note, kind: 'note' };

  const mockTests = await getCollection('mock_tests');
  const mockTest = await mockTests.findOne({
    $or: [{ pdfFileId: fileIdStr }, { pdfPreviewFileId: fileIdStr }],
  });
  if (mockTest) return { doc: mockTest, kind: 'mock_test' };

  return null;
}

// Backwards-compatible alias used by older blog-only callers.
async function findBlogForFile(fileIdStr) {
  const found = await findOwnerForFile(fileIdStr);
  return found?.doc || null;
}

async function streamGridFSFile(fileIdStr, disposition = 'inline', filename = 'document.pdf') {
  let objId;
  try {
    objId = new ObjectId(fileIdStr);
  } catch (_e) {
    return NextResponse.json({ success: false, error: 'Invalid file id' }, { status: 400 });
  }

  const bucket = await getPdfBucket('pdfs');
  const files = await bucket.find({ _id: objId }).toArray();
  if (files.length === 0) {
    return NextResponse.json({ success: false, error: 'PDF not found' }, { status: 404 });
  }
  const fileDoc = files[0];

  const nodeStream = bucket.openDownloadStream(objId);

  // Convert Node Readable to Web ReadableStream
  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk)));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  const safeName = (filename || fileDoc.filename || 'document.pdf').replace(/[\r\n"]/g, '_');
  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Content-Length': String(fileDoc.length || ''),
    'Cache-Control': 'private, max-age=60',
    'Content-Disposition': `${disposition}; filename="${safeName}"`,
    'X-Content-Type-Options': 'nosniff',
  });

  return new NextResponse(webStream, { status: 200, headers });
}

async function getAuthUser(request) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  return await getUserFromToken(token);
}

export { findOwnerForFile, findBlogForFile, streamGridFSFile, getAuthUser };
