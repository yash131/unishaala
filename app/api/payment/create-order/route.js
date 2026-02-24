import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase, getCollection } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { createOrder } from '@/lib/razorpay';

export async function POST(request) {
  try {
    // Get authenticated user
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Please login to make payment' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { examId, mockTestId, amount, paymentType } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    await connectToDatabase();

    // Get item details
    let itemName = 'Test Purchase';
    if (examId) {
      const exams = await getCollection('exams');
      const exam = await exams.findOne({ id: examId });
      if (exam) itemName = `${exam.name} - Full Access`;
    } else if (mockTestId) {
      const mockTests = await getCollection('mock_tests');
      const test = await mockTests.findOne({ id: mockTestId });
      if (test) itemName = test.title;
    }

    // Create Razorpay order
    const receipt = `rcpt_${Date.now()}`;
    const order = await createOrder({
      amount: parseFloat(amount),
      currency: 'INR',
      receipt,
      notes: {
        userId: user.id,
        examId: examId || '',
        mockTestId: mockTestId || '',
        itemName,
      },
    });

    // Save transaction to database
    const transactions = await getCollection('transactions');
    const transaction = {
      id: uuidv4(),
      razorpayOrderId: order.id,
      receipt,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || '',
      examId: examId || null,
      mockTestId: mockTestId || null,
      paymentType: paymentType || 'exam_purchase',
      itemName,
      amount: parseFloat(amount),
      currency: 'INR',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await transactions.insertOne(transaction);

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        name: 'Unishaala',
        description: itemName,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || '',
        },
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
