import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, getPdfBucket } from '@/lib/db';
import { getAuthUser } from '@/lib/pdfStream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    const contentType = file.type || 'image/jpeg';
    if (!ALLOWED_MIME.has(contentType)) {
      return NextResponse.json({ success: false, error: 'Only JPG/PNG/WEBP/GIF images allowed' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length === 0) {
      return NextResponse.json({ success: false, error: 'Empty file' }, { status: 400 });
    }
    if (buf.length > MAX_AVATAR_BYTES) {
      return NextResponse.json({ success: false, error: `Image too large (max ${Math.round(MAX_AVATAR_BYTES / (1024 * 1024))} MB)` }, { status: 400 });
    }

    const users = await getCollection('users');
    const dbUser = await users.findOne({ id: user.id });
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const bucket = await getPdfBucket('avatars');

    // Delete previous avatar if any
    if (dbUser.avatarFileId) {
      try { await bucket.delete(new ObjectId(dbUser.avatarFileId)); } catch (_e) {}
    }

    const safeName = `avatar-${user.id}-${Date.now()}`;
    const uploadStream = bucket.openUploadStream(safeName, {
      contentType,
      metadata: { userId: user.id, contentType, uploadedAt: new Date() },
    });

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
      uploadStream.end(buf);
    });

    const fileId = uploadStream.id.toString();
    await users.updateOne(
      { id: user.id },
      { $set: { avatarFileId: fileId, updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      data: {
        avatarFileId: fileId,
        avatarUrl: `/api/user/${user.id}/avatar?v=${Date.now()}`,
      },
    });
  } catch (e) {
    console.error('Avatar upload error:', e);
    return NextResponse.json({ success: false, error: e.message || 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const users = await getCollection('users');
    const dbUser = await users.findOne({ id: user.id });
    if (!dbUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    if (dbUser.avatarFileId) {
      try {
        const bucket = await getPdfBucket('avatars');
        await bucket.delete(new ObjectId(dbUser.avatarFileId));
      } catch (_e) {}
    }
    await users.updateOne({ id: user.id }, { $unset: { avatarFileId: '' }, $set: { updatedAt: new Date() } });
    return NextResponse.json({ success: true, message: 'Avatar removed' });
  } catch (e) {
    console.error('Avatar delete error:', e);
    return NextResponse.json({ success: false, error: e.message || 'Delete failed' }, { status: 500 });
  }
}
