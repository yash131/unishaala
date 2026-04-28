import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, getPdfBucket } from '@/lib/db';
import { getAuthUser } from '@/lib/pdfStream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image');
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
    if (buf.length > MAX_BYTES) {
      return NextResponse.json({ success: false, error: `Image too large (max ${Math.round(MAX_BYTES / (1024 * 1024))} MB)` }, { status: 400 });
    }

    const settings = await getCollection('site_settings');
    const existing = await settings.findOne({ id: 'hero' });

    const bucket = await getPdfBucket('banners');

    // Delete previous banner from GridFS if it was uploaded (not external URL)
    if (existing?.heroBannerFileId) {
      try { await bucket.delete(new ObjectId(existing.heroBannerFileId)); } catch (_e) {}
    }

    const safeName = `hero-banner-${Date.now()}`;
    const uploadStream = bucket.openUploadStream(safeName, {
      contentType,
      metadata: { uploadedBy: user.id, contentType, uploadedAt: new Date() },
    });

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
      uploadStream.end(buf);
    });

    const fileId = uploadStream.id.toString();
    const imageUrl = `/api/creative-control/banner-image?v=${Date.now()}`;

    await settings.updateOne(
      { id: 'hero' },
      {
        $set: {
          id: 'hero',
          heroBannerFileId: fileId,
          heroBannerImageUrl: imageUrl,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      data: { heroBannerFileId: fileId, heroBannerImageUrl: imageUrl },
    });
  } catch (e) {
    console.error('Banner upload error:', e);
    return NextResponse.json({ success: false, error: e.message || 'Upload failed' }, { status: 500 });
  }
}
