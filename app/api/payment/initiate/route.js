import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase, getCollection } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { initiatePayment, generateMerchantTxnNo } from '@/lib/icici';

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

    // Generate unique transaction number
    const merchantTxnNo = generateMerchantTxnNo();

    // Get item details
    let itemName = 'Test Purchase';
    let itemId = mockTestId || examId;

    if (examId) {
      const exams = await getCollection('exams');
      const exam = await exams.findOne({ id: examId });
      if (exam) itemName = `${exam.name} - Full Access`;
    } else if (mockTestId) {
      const mockTests = await getCollection('mock_tests');
      const test = await mockTests.findOne({ id: mockTestId });
      if (test) itemName = test.title;
    }

    // Determine return URL from request headers
    // Use static HTML page instead of API endpoint to avoid 403 from platform security
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_BASE_URL;
    const returnUrl = `${baseUrl}/payment-callback.html`;

    console.log('Payment initiation for:', user.email);
    console.log('Return URL:', returnUrl);

    // Create transaction record
    const transactions = await getCollection('transactions');
    const transaction = {
      id: uuidv4(),
      merchantTxnNo,
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
      updatedAt: new Date()
    };

    await transactions.insertOne(transaction);

    // Initiate payment with ICICI
    const result = await initiatePayment({
      merchantTxnNo,
      amount,
      customerEmail: user.email,
      customerName: user.name,
      customerMobile: user.phone || '9999999999',
      returnUrl,
      addlParam1: '000',
      addlParam2: itemId || '111'
    });

    if (result.success) {
      // Update transaction with gateway response
      await transactions.updateOne(
        { merchantTxnNo },
        { $set: { tranCtx: result.tranCtx, gatewayResponse: result.rawResponse, updatedAt: new Date() } }
      );

      return NextResponse.json({
        success: true,
        data: {
          transactionId: merchantTxnNo,
          amount: parseFloat(amount),
          paymentUrl: result.paymentUrl,
          tranCtx: result.tranCtx
        }
      });
    } else {
      // Update transaction as failed
      await transactions.updateOne(
        { merchantTxnNo },
        { $set: { status: 'FAILED', gatewayResponse: result.rawResponse, error: result.error, updatedAt: new Date() } }
      );

      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json({ success: false, error: 'Payment initiation failed' }, { status: 500 });
  }
}
