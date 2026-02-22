import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/db';
import { checkPaymentStatus } from '@/lib/icici';

export async function POST(request) {
  try {
    const body = await request.json();
    const { merchantTxnNo } = body;

    if (!merchantTxnNo) {
      return NextResponse.json({ success: false, error: 'Transaction ID required' }, { status: 400 });
    }

    await connectToDatabase();
    const transactions = await getCollection('transactions');

    // Find local transaction
    let transaction = await transactions.findOne({ merchantTxnNo });

    // If already completed, return immediately
    if (transaction && (transaction.status === 'SUCCESS' || transaction.status === 'FAILED')) {
      return NextResponse.json({
        success: true,
        data: {
          transactionId: transaction.merchantTxnNo,
          status: transaction.status,
          examId: transaction.examId,
          amount: transaction.amount,
          txnRespDescription: transaction.txnRespDescription
        }
      });
    }

    // Check with ICICI
    console.log('Verifying with ICICI:', merchantTxnNo);
    const iciciResult = await checkPaymentStatus(merchantTxnNo);
    console.log('ICICI result:', iciciResult);

    if (iciciResult.success) {
      const newStatus = iciciResult.status;
      
      if (transaction) {
        // Update existing transaction
        await transactions.updateOne(
          { merchantTxnNo },
          {
            $set: {
              status: newStatus,
              iciciTxnId: iciciResult.iciciTxnId,
              txnResponseCode: iciciResult.responseCode,
              txnRespDescription: iciciResult.responseDescription,
              iciciPayload: iciciResult.rawResponse,
              completedAt: newStatus !== 'PENDING' ? new Date() : null,
              updatedAt: new Date()
            }
          }
        );

        // Grant exam access if success
        if (newStatus === 'SUCCESS' && transaction.examId) {
          const users = await getCollection('users');
          await users.updateOne(
            { id: transaction.userId },
            { $addToSet: { purchasedExams: transaction.examId } }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            transactionId: merchantTxnNo,
            status: newStatus,
            examId: transaction.examId,
            amount: transaction.amount,
            txnRespDescription: iciciResult.responseDescription
          }
        });
      }
    }

    // Return current status
    return NextResponse.json({
      success: true,
      data: {
        transactionId: merchantTxnNo,
        status: transaction?.status || 'PENDING',
        examId: transaction?.examId,
        amount: transaction?.amount
      }
    });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
