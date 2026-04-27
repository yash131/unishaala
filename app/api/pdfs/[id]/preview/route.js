import { NextResponse } from 'next/server';
import { findOwnerForFile, streamGridFSFile } from '@/lib/pdfStream';

export const dynamic = 'force-dynamic';

// Public — returns only the first-page preview PDF for any blog or job.
export async function GET(request, { params }) {
  const { id } = params;
  if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

  const found = await findOwnerForFile(id);
  if (!found) return NextResponse.json({ success: false, error: 'PDF not found' }, { status: 404 });

  // Only serve the preview file through this route
  if (found.doc.pdfPreviewFileId !== id) {
    return NextResponse.json({ success: false, error: 'Preview not available' }, { status: 403 });
  }

  const filename = found.doc.pdfFileName ? `preview-${found.doc.pdfFileName}` : 'preview.pdf';
  return streamGridFSFile(id, 'inline', filename);
}
