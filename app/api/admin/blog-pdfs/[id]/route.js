import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, getPdfBucket } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function assertAdmin(request) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  const user = await getUserFromToken(token);
  if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) return null;
  return user;
}

// PUT: update label (and optionally replace file)
export async function PUT(request, { params }) {
  try {
    const admin = await assertAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const col = await getCollection('blog_pdfs');
    const item = await col.findOne({ id });
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const update = { updatedAt: new Date() };
    if (typeof body.label === 'string' && body.label.trim()) {
      update.label = body.label.trim();
    }
    if (Object.keys(update).length === 1) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }
    await col.updateOne({ id }, { $set: update });
    const updated = await col.findOne({ id });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error('Update blog PDF error:', e);
    return NextResponse.json({ success: false, error: e.message || 'Update failed' }, { status: 500 });
  }
}

// DELETE: remove library entry + GridFS file
export async function DELETE(request, { params }) {
  try {
    const admin = await assertAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const col = await getCollection('blog_pdfs');
    const item = await col.findOne({ id });
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const bucket = await getPdfBucket('pdfs');
    if (item.fileId) {
      try { await bucket.delete(new ObjectId(item.fileId)); } catch (_e) {}
    }
    await col.deleteOne({ id });
    return NextResponse.json({ success: true, message: 'PDF deleted' });
  } catch (e) {
    console.error('Delete blog PDF error:', e);
    return NextResponse.json({ success: false, error: e.message || 'Delete failed' }, { status: 500 });
  }
}
