import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/db';
import { determineStatus, checkPaymentStatus } from '@/lib/icici';

// CORS headers for this endpoint
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Process payment callback data from client-side
export async function POST(request) {
  try {
    await connectToDatabase();
    const transactions = await getCollection('transactions');

    const body = await request.json();
    console.log('=== Processing Payment Callback (Client-Side) ===');
    console.log('Data:', JSON.stringify(body, null, 2));

    const merchantTxnNo = body.merchantTxnNo;

    if (!merchantTxnNo) {
      return NextResponse.json(
        { success: false, error: 'No transaction ID provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find transaction in database
    let transaction = await transactions.findOne({ merchantTxnNo });

    // Determine status from callback data
    const statusInfo = determineStatus(body);
    console.log('Status from callback:', statusInfo);

    if (transaction) {
      // Update existing transaction
      await transactions.updateOne(
        { merchantTxnNo },
        {
          $set: {
            status: statusInfo.status,
            iciciTxnId: statusInfo.iciciTxnId || body.txnID || body.paymentID,
            txnAuthID: statusInfo.authCode,
            txnResponseCode: statusInfo.responseCode,
            txnRespDescription: statusInfo.description,
            paymentMethod: statusInfo.paymentMethod || body.paymentMode,
            paymentSubInstType: statusInfo.paymentSubType || body.paymentSubInstType,
            paymentDateTime: statusInfo.paymentDateTime || body.paymentDateTime,
            otherCharges: statusInfo.otherCharges || body.oth_charge,
            iciciPayload: body,
            gatewayResponse: body,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // Grant exam access if successful
      if (statusInfo.isSuccess && transaction.examId) {
        const users = await getCollection('users');
        await users.updateOne(
          { id: transaction.userId },
          { $addToSet: { purchasedExams: transaction.examId } }
        );
        console.log('Access granted for exam:', transaction.examId, 'to user:', transaction.userId);
      }

      return NextResponse.json(
        { success: true, status: statusInfo.status, merchantTxnNo },
        { headers: corsHeaders }
      );
    } else {
      // Transaction not found locally - verify with ICICI
      console.log('Transaction not found locally, checking with ICICI...');
      
      const iciciResult = await checkPaymentStatus(merchantTxnNo);
      
      if (iciciResult.success) {
        // Create a new transaction record
        const newTxn = {
          id: require('uuid').v4(),
          merchantTxnNo,
          status: iciciResult.status,
          iciciTxnId: body.txnID || body.paymentID || iciciResult.iciciTxnId,
          txnResponseCode: iciciResult.responseCode,
          txnRespDescription: iciciResult.responseDescription,
          amount: parseFloat(body.amount) || 0,
          iciciPayload: { ...body, iciciVerification: iciciResult.rawResponse },
          gatewayResponse: body,
          crossEnvironment: true,
          createdAt: new Date(),
          completedAt: new Date(),
          updatedAt: new Date()
        };
        
        await transactions.insertOne(newTxn);
        
        return NextResponse.json(
          { success: true, status: iciciResult.status, merchantTxnNo, verified: true },
          { headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Process callback error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
