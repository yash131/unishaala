import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
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

function sanitizeCode(raw) {
  return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

// GET: list all coupons
export async function GET(request) {
  try {
    const admin = await assertAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const col = await getCollection('coupons');
    const items = await col.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, data: items });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message || 'Failed' }, { status: 500 });
  }
}

// POST: create a coupon
export async function POST(request) {
  try {
    const admin = await assertAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const code = sanitizeCode(body.code);
    const type = body.type === 'flat' ? 'flat' : 'percent';
    const value = Number(body.value);
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    const usageLimit = body.usageLimit ? Math.max(1, parseInt(body.usageLimit, 10)) : null;
    const maxDiscount = body.maxDiscount ? Math.max(0, Number(body.maxDiscount)) : null; // for percent type
    const minAmount = body.minAmount ? Math.max(0, Number(body.minAmount)) : 0;
    const active = body.active !== false;
    const appliesTo = 'get_pass'; // currently coupons only apply to Get Pass

    if (!code || code.length < 3) {
      return NextResponse.json({ success: false, error: 'Code must be at least 3 characters (A-Z, 0-9, _, -)' }, { status: 400 });
    }
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ success: false, error: 'Discount value must be a positive number' }, { status: 400 });
    }
    if (type === 'percent' && value > 100) {
      return NextResponse.json({ success: false, error: 'Percent discount cannot exceed 100' }, { status: 400 });
    }
    if (expiresAt && isNaN(expiresAt.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid expiry date' }, { status: 400 });
    }

    const col = await getCollection('coupons');
    const existing = await col.findOne({ code });
    if (existing) {
      return NextResponse.json({ success: false, error: 'A coupon with this code already exists' }, { status: 400 });
    }

    const doc = {
      id: uuidv4(),
      code,
      type,
      value,
      maxDiscount,
      minAmount,
      expiresAt,
      usageLimit,
      usageCount: 0,
      active,
      appliesTo,
      description: (body.description || '').toString().slice(0, 200),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: admin.id,
    };
    await col.insertOne(doc);
    return NextResponse.json({ success: true, data: doc });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message || 'Create failed' }, { status: 500 });
  }
}
