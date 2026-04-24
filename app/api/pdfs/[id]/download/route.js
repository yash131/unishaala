import { NextResponse } from 'next/server';
import { findBlogForFile, streamGridFSFile, getAuthUser } from '@/lib/pdfStream';

export const dynamic = 'force-dynamic';

// Protected — download endpoint. Requires logged-in + phoneVerified + pdfPermission === 'view_download'.
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
  if (!user.phoneVerified) {
    return NextResponse.json(
      { success: false, error: 'Phone verification required', code: 'PHONE_VERIFY_REQUIRED' },
      { status: 403 }
    );
  }

  const blog = await findBlogForFile(id);
  if (!blog) return NextResponse.json({ success: false, error: 'PDF not found' }, { status: 404 });

  if (blog.pdfFileId !== id) {
    return NextResponse.json({ success: false, error: 'File not available' }, { status: 403 });
  }
  if (blog.pdfPermission !== 'view_download') {
    return NextResponse.json(
      { success: false, error: 'Download not permitted for this document', code: 'DOWNLOAD_FORBIDDEN' },
      { status: 403 }
    );
  }

  const filename = blog.pdfFileName || 'document.pdf';
  return streamGridFSFile(id, 'attachment', filename);
}
