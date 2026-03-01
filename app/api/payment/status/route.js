import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { transactionId, orderId } = body;

    if (!transactionId && !orderId) {
      return NextResponse.json({ success: false, error: 'Transaction ID or Order ID required' }, { status: 400 });
    }

    await connectToDatabase();
    const transactions = await getCollection('transactions');

    const transaction = await transactions.findOne({
      $or: [
        { razorpayPaymentId: transactionId },
        { razorpayOrderId: orderId || transactionId },
        { id: transactionId },
      ],
    });

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction.razorpayPaymentId || transaction.id,
        orderId: transaction.razorpayOrderId,
        status: transaction.status,
        amount: transaction.amount,
        itemName: transaction.itemName,
        examId: transaction.examId,
        mockTestId: transaction.mockTestId,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
        paymentDetails: transaction.paymentDetails,
      },
    });
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get status' }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('txn') || searchParams.get('transactionId');
  const orderId = searchParams.get('orderId');

  const mockRequest = { json: async () => ({ transactionId, orderId }) };
  return POST(mockRequest);
}
