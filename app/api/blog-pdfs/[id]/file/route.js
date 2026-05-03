import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { streamGridFSFile } from '@/lib/pdfStream';

export const dynamic = 'force-dynamic';

// Public: stream a blog library PDF inline (no auth required)
export async function GET(_request, { params }) {
  try {
    const { id } = params;
    const col = await getCollection('blog_pdfs');
    const item = await col.findOne({ id });
    if (!item || !item.fileId) {
      return NextResponse.json({ success: false, error: 'PDF not found' }, { status: 404 });
    }
    return streamGridFSFile(item.fileId, 'inline', item.fileName || 'document.pdf');
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message || 'Failed' }, { status: 500 });
  }
}
