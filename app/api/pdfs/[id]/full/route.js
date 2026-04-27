import { NextResponse } from 'next/server';
import { findOwnerForFile, streamGridFSFile, getAuthUser } from '@/lib/pdfStream';

export const dynamic = 'force-dynamic';

// Protected — full PDF (blogs and jobs). Requires logged-in user.
export async function GET(request, { params }) {
  const { id } = params;
  if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Login required', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  const found = await findOwnerForFile(id);
  if (!found) return NextResponse.json({ success: false, error: 'PDF not found' }, { status: 404 });

  // Only serve the full file through this route (not preview)
  if (found.doc.pdfFileId !== id) {
    return NextResponse.json({ success: false, error: 'Full PDF not available' }, { status: 403 });
  }

  const filename = found.doc.pdfFileName || 'document.pdf';
  return streamGridFSFile(id, 'inline', filename);
}
