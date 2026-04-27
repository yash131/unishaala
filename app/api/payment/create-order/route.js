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
    const { examId, domainId, amount, paymentType } = body;

    // Only exam/domain/get_pass/PYQ-exam/PYQ-domain purchases are supported. Individual test purchases are disabled.
    const ALLOWED = new Set(['exam_purchase', 'domain_purchase', 'exam_pyq_purchase', 'domain_pyq_purchase', 'get_pass']);
    if (!ALLOWED.has(paymentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment type. Only exam, domain or pass purchases are supported.' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    await connectToDatabase();

    // Get item details
    let itemName = 'Unishaala Purchase';
    if (paymentType === 'exam_purchase' && examId) {
      const exams = await getCollection('exams');
      const exam = await exams.findOne({ id: examId });
      if (exam) itemName = `${exam.name} — Full Test Series`;
    } else if (paymentType === 'domain_purchase' && domainId) {
      const domains = await getCollection('domains');
      const domain = await domains.findOne({ id: domainId });
      if (domain) itemName = `${domain.name} — Domain (Test Series)`;
    } else if (paymentType === 'exam_pyq_purchase' && examId) {
      const exams = await getCollection('exams');
      const exam = await exams.findOne({ id: examId });
      if (exam) itemName = `${exam.name} — Full PYQ Access`;
    } else if (paymentType === 'domain_pyq_purchase' && domainId) {
      const domains = await getCollection('domains');
      const domain = await domains.findOne({ id: domainId });
      if (domain) itemName = `${domain.name} — Domain (PYQ)`;
    } else if (paymentType === 'get_pass') {
      itemName = 'Unishaala Get Pass — All-Access';
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
        domainId: domainId || '',
        paymentType,
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
      examId: (paymentType === 'exam_purchase' || paymentType === 'exam_pyq_purchase') ? (examId || null) : null,
      domainId: (paymentType === 'domain_purchase' || paymentType === 'domain_pyq_purchase') ? (domainId || null) : null,
      mockTestId: null,
      paymentType,
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
