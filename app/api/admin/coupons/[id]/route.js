import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function assertAdmin(request) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  const user = await getUserFromToken(token);
  if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) return null;
  return user;
}

// PUT: update coupon (active flag, value, type, expiry, usageLimit, etc.)
export async function PUT(request, { params }) {
  try {
    const admin = await assertAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = params;
    const col = await getCollection('coupons');
    const item = await col.findOne({ id });
    if (!item) return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const update = { updatedAt: new Date() };

    if (body.type !== undefined) {
      update.type = body.type === 'flat' ? 'flat' : 'percent';
    }
    if (body.value !== undefined) {
      const v = Number(body.value);
      if (!Number.isFinite(v) || v <= 0) {
        return NextResponse.json({ success: false, error: 'Discount value must be a positive number' }, { status: 400 });
      }
      const t = update.type || item.type;
      if (t === 'percent' && v > 100) {
        return NextResponse.json({ success: false, error: 'Percent discount cannot exceed 100' }, { status: 400 });
      }
      update.value = v;
    }
    if (body.expiresAt !== undefined) {
      if (body.expiresAt === null || body.expiresAt === '') update.expiresAt = null;
      else {
        const d = new Date(body.expiresAt);
        if (isNaN(d.getTime())) return NextResponse.json({ success: false, error: 'Invalid expiry date' }, { status: 400 });
        update.expiresAt = d;
      }
    }
    if (body.usageLimit !== undefined) {
      update.usageLimit = body.usageLimit ? Math.max(1, parseInt(body.usageLimit, 10)) : null;
    }
    if (body.maxDiscount !== undefined) {
      update.maxDiscount = body.maxDiscount ? Math.max(0, Number(body.maxDiscount)) : null;
    }
    if (body.minAmount !== undefined) {
      update.minAmount = Math.max(0, Number(body.minAmount) || 0);
    }
    if (body.active !== undefined) update.active = !!body.active;
    if (body.description !== undefined) update.description = String(body.description).slice(0, 200);

    await col.updateOne({ id }, { $set: update });
    const updated = await col.findOne({ id });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await assertAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = params;
    const col = await getCollection('coupons');
    const r = await col.deleteOne({ id });
    if (r.deletedCount === 0) return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Coupon deleted' });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message || 'Delete failed' }, { status: 500 });
  }
}
