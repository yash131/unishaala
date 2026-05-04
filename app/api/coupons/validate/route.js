import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Validate a coupon code against a Get Pass purchase amount.
 * Body: { code, paymentType:'get_pass', amount }
 * Returns: { valid:true, discount, finalAmount, code, type, value, ... } OR { valid:false, error }
 *
 * This endpoint is also used internally by /api/payment/create-order to compute
 * the authoritative final amount on the server (never trust client-supplied amount).
 */
export async function applyCouponServerSide({ code, paymentType, amount, userId }) {
  if (!code) return { valid: false, error: 'Coupon code is required' };
  if (paymentType !== 'get_pass') return { valid: false, error: 'Coupons currently only apply to Get Pass purchases' };
  const baseAmount = Number(amount);
  if (!Number.isFinite(baseAmount) || baseAmount <= 0) return { valid: false, error: 'Invalid amount' };

  const col = await getCollection('coupons');
  const sanitized = String(code).trim().toUpperCase();
  const coupon = await col.findOne({ code: sanitized });
  if (!coupon) return { valid: false, error: 'Invalid coupon code' };
  if (!coupon.active) return { valid: false, error: 'This coupon is currently disabled' };
  if (coupon.appliesTo && coupon.appliesTo !== paymentType) {
    return { valid: false, error: 'This coupon is not applicable to this purchase' };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, error: 'This coupon has expired' };
  }
  if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
    return { valid: false, error: 'This coupon has reached its usage limit' };
  }
  if (coupon.minAmount && baseAmount < coupon.minAmount) {
    return { valid: false, error: `Minimum order ₹${coupon.minAmount} required for this coupon` };
  }

  // Optional per-user once-only enforcement: if usage tracking is desired per user,
  // we can check transactions collection. Skipping for v1 (admin can use usageLimit).

  let discount = 0;
  if (coupon.type === 'percent') {
    discount = Math.round((baseAmount * coupon.value) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  } else {
    discount = Math.min(coupon.value, baseAmount);
  }
  // Never go below ₹1 (Razorpay min) — clamp
  let finalAmount = Math.max(1, baseAmount - discount);
  // Recompute actual applied discount to keep numbers consistent
  discount = baseAmount - finalAmount;

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
    baseAmount,
    finalAmount,
    description: coupon.description || '',
    couponId: coupon.id,
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    // Logged-in user is preferred but not strictly required for validation preview
    const token = request.cookies.get('auth_token')?.value;
    let userId = null;
    if (token) {
      const u = await getUserFromToken(token);
      if (u) userId = u.id;
    }
    const result = await applyCouponServerSide({
      code: body.code,
      paymentType: body.paymentType,
      amount: body.amount,
      userId,
    });
    if (result.valid) {
      return NextResponse.json({ success: true, data: result });
    }
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message || 'Validation failed' }, { status: 500 });
  }
}
