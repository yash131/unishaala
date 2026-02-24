/**
 * Razorpay Payment Gateway Integration
 */
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 */
export async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const options = {
    amount: Math.round(amount * 100), // Razorpay expects amount in paise
    currency,
    receipt,
    notes,
  };

  const order = await razorpay.orders.create(options);
  return order;
}

/**
 * Verify payment signature
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const crypto = require('crypto');
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  
  return expectedSignature === signature;
}

/**
 * Fetch payment details
 */
export async function fetchPayment(paymentId) {
  return await razorpay.payments.fetch(paymentId);
}

/**
 * Fetch order details
 */
export async function fetchOrder(orderId) {
  return await razorpay.orders.fetch(orderId);
}

export default razorpay;
