import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, getPdfBucket } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

/**
 * Resolve a blog by its pdfId / pdfPreviewId (these are strings — pdfFileId refs).
 * pdfId convention: we store the GridFS ObjectId (string) on the blog document.
 */
async function findBlogForFile(fileIdStr) {
  const blogs = await getCollection('blogs');
  // Match either the full PDF or the preview PDF
  return await blogs.findOne({
    $or: [{ pdfFileId: fileIdStr }, { pdfPreviewFileId: fileIdStr }],
  });
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

export { findBlogForFile, streamGridFSFile, getAuthUser };
