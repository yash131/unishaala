import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/db';
import { verifyPaymentSignature, fetchPayment } from '@/lib/razorpay';

export async function POST(request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing payment details' 
      }, { status: 400 });
    }

    // Verify signature
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid payment signature' 
      }, { status: 400 });
    }

    await connectToDatabase();
    const transactions = await getCollection('transactions');

    // Find and update transaction
    const transaction = await transactions.findOne({ razorpayOrderId: razorpay_order_id });

    if (!transaction) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction not found' 
      }, { status: 404 });
    }

    // Fetch payment details from Razorpay
    const payment = await fetchPayment(razorpay_payment_id);

    // Update transaction
    await transactions.updateOne(
      { razorpayOrderId: razorpay_order_id },
      {
        $set: {
          status: 'SUCCESS',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paymentMethod: payment.method,
          paymentDetails: payment,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Grant access based on paymentType. Exam purchase unlocks every domain in the exam too.
    const users = await getCollection('users');
    const userUpdate = { $set: { updatedAt: new Date() } };
    const addToSet = {};

    if (transaction.paymentType === 'get_pass') {
      // All-access pass. Duration configured by admin in pricing_config.getPassDurationDays (default 365).
      const cfg = await getCollection('pricing_config');
      const pc = await cfg.findOne({ id: 'global' });
      const days = Math.max(1, parseInt(pc?.getPassDurationDays, 10) || 365);
      const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      userUpdate.$set.hasPass = true;
      userUpdate.$set.passExpiresAt = expires;
    } else if (transaction.paymentType === 'exam_purchase' && transaction.examId) {
      addToSet.purchasedExams = transaction.examId;
      // Also unlock all Test-Series domains for this exam (so per-domain checks succeed too)
      try {
        const domainsCol = await getCollection('domains');
        const domainIds = (await domainsCol.find({ examId: transaction.examId }).toArray()).map(d => d.id);
        if (domainIds.length > 0) {
          addToSet.purchasedDomains = { $each: domainIds };
        }
      } catch (_e) {}
    } else if (transaction.paymentType === 'domain_purchase' && transaction.domainId) {
      addToSet.purchasedDomains = transaction.domainId;
    } else if (transaction.paymentType === 'exam_pyq_purchase' && transaction.examId) {
      addToSet.purchasedPyqExams = transaction.examId;
      try {
        const domainsCol = await getCollection('domains');
        const domainIds = (await domainsCol.find({ examId: transaction.examId }).toArray()).map(d => d.id);
        if (domainIds.length > 0) {
          addToSet.purchasedPyqDomains = { $each: domainIds };
        }
      } catch (_e) {}
    } else if (transaction.paymentType === 'domain_pyq_purchase' && transaction.domainId) {
      addToSet.purchasedPyqDomains = transaction.domainId;
    }

    if (Object.keys(addToSet).length > 0) {
      userUpdate.$addToSet = addToSet;
    }

    await users.updateOne({ id: transaction.userId }, userUpdate);

    // Bump coupon usageCount on successful payment (best-effort)
    if (transaction.coupon?.id) {
      try {
        const couponsCol = await getCollection('coupons');
        await couponsCol.updateOne(
          { id: transaction.coupon.id },
          { $inc: { usageCount: 1 }, $set: { updatedAt: new Date() } }
        );
      } catch (_e) {}
    }

    return NextResponse.json({
      success: true,
      status: 'SUCCESS',
      transactionId: razorpay_payment_id,
      message: 'Payment verified successfully',
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        examId: transaction.examId,
        amount: transaction.amount,
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Verification failed' 
    }, { status: 500 });
  }
}
