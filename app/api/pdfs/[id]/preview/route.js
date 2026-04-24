import { NextResponse } from 'next/server';
import { findBlogForFile, streamGridFSFile } from '@/lib/pdfStream';

export const dynamic = 'force-dynamic';

// Public — returns only the first-page preview PDF for any blog.
export async function GET(request, { params }) {
  const { id } = params;
  if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

  // The id here should be the pdfPreviewFileId stored on the blog document.
  const blog = await findBlogForFile(id);
  if (!blog) return NextResponse.json({ success: false, error: 'PDF not found' }, { status: 404 });

  // Only serve the preview file through this route
  if (blog.pdfPreviewFileId !== id) {
    return NextResponse.json({ success: false, error: 'Preview not available' }, { status: 403 });
  }

  const filename = blog.pdfFileName ? `preview-${blog.pdfFileName}` : 'preview.pdf';
  return streamGridFSFile(id, 'inline', filename);
}
