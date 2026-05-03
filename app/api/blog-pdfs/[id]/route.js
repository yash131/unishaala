import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Public: get metadata for a blog PDF library item (used by viewer page)
export async function GET(_request, { params }) {
  try {
    const { id } = params;
    const col = await getCollection('blog_pdfs');
    const item = await col.findOne({ id });
    if (!item) {
      return NextResponse.json({ success: false, error: 'PDF no longer available', code: 'PDF_MISSING' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        id: item.id,
        label: item.label,
        fileName: item.fileName,
        size: item.size,
        fileUrl: `/api/blog-pdfs/${item.id}/file`,
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message || 'Failed' }, { status: 500 });
  }
}
