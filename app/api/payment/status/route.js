import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { checkPaymentStatus } from '@/lib/icici';

export async function POST(request) {
  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Transaction ID required' }, { status: 400 });
    }

    await connectToDatabase();
    const transactions = await getCollection('transactions');

    // Find transaction locally
    let transaction = await transactions.findOne({
      $or: [
        { transactionId },
        { merchantTxnNo: transactionId },
        { id: transactionId }
      ]
    });

    // If found locally with completed status, return it
    if (transaction && (transaction.status === 'SUCCESS' || transaction.status === 'FAILED')) {
      return NextResponse.json({
        success: true,
        data: formatTransactionResponse(transaction)
      });
    }

    // If pending or not found, check with ICICI
    const merchantTxnNo = transaction?.merchantTxnNo || transactionId;
    console.log('Checking status with ICICI for:', merchantTxnNo);

    const iciciResult = await checkPaymentStatus(merchantTxnNo);

    if (iciciResult.success) {
      // Update local transaction if exists
      if (transaction) {
        await transactions.updateOne(
          { merchantTxnNo },
          {
            $set: {
              status: iciciResult.status,
              iciciTxnId: iciciResult.iciciTxnId,
              txnResponseCode: iciciResult.responseCode,
              txnRespDescription: iciciResult.responseDescription,
              iciciPayload: iciciResult.rawResponse,
              updatedAt: new Date(),
              completedAt: iciciResult.status !== 'PENDING' ? new Date() : null
            }
          }
        );

        // Grant access if successful
        if (iciciResult.status === 'SUCCESS' && transaction.examId) {
          const users = await getCollection('users');
          await users.updateOne(
            { id: transaction.userId },
            { $addToSet: { purchasedExams: transaction.examId } }
          );
        }

        // Fetch updated transaction
        transaction = await transactions.findOne({ merchantTxnNo });
      }

      return NextResponse.json({
        success: true,
        data: transaction ? formatTransactionResponse(transaction) : {
          transactionId: merchantTxnNo,
          status: iciciResult.status,
          responseCode: iciciResult.responseCode,
          responseDescription: iciciResult.responseDescription,
          iciciPayload: iciciResult.rawResponse
        }
      });
    }

    // If transaction exists locally, return what we have
    if (transaction) {
      return NextResponse.json({
        success: true,
        data: formatTransactionResponse(transaction)
      });
    }

    return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });

  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get payment status' }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('txn') || searchParams.get('transactionId');

  if (!transactionId) {
    return NextResponse.json({ success: false, error: 'Transaction ID required' }, { status: 400 });
  }

  // Reuse POST handler logic
  const mockRequest = {
    json: async () => ({ transactionId })
  };

  return POST(mockRequest);
}

function formatTransactionResponse(txn) {
  return {
    transactionId: txn.merchantTxnNo || txn.transactionId,
    orderId: txn.id,
    status: txn.status,
    amount: txn.amount,
    itemName: txn.itemName,
    paymentMethod: txn.paymentMethod,
    paymentSubInstType: txn.paymentSubInstType,
    iciciTransactionId: txn.iciciTxnId,
    txnAuthID: txn.txnAuthID,
    txnResponseCode: txn.txnResponseCode,
    txnRespDescription: txn.txnRespDescription,
    paymentDateTime: txn.paymentDateTime,
    otherCharges: txn.otherCharges,
    createdAt: txn.createdAt,
    completedAt: txn.completedAt,
    iciciPayload: txn.iciciPayload || txn.gatewayResponse
  };
}
