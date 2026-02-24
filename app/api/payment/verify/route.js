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

    // Grant exam access
    if (transaction.examId) {
      const users = await getCollection('users');
      await users.updateOne(
        { id: transaction.userId },
        { $addToSet: { purchasedExams: transaction.examId } }
      );
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
