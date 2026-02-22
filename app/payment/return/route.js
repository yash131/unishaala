import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/db';
import { checkPaymentStatus, determineStatus } from '@/lib/icici';

// CORS headers to allow all origins
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers });
}

// GET - Handle redirect from ICICI
export async function GET(request) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  return handlePaymentCallback(params);
}

// POST - Handle callback from ICICI
export async function POST(request) {
  let data = {};
  
  try {
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else if (contentType.includes('form')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      for (const [key, value] of params.entries()) {
        data[key] = value;
      }
    }
  } catch (e) {
    console.log('Parse error, continuing:', e.message);
  }
  
  // Also get URL params
  const url = new URL(request.url);
  for (const [key, value] of url.searchParams.entries()) {
    if (!data[key]) data[key] = value;
  }
  
  return handlePaymentCallback(data);
}

async function handlePaymentCallback(data) {
  console.log('=== Payment Callback ===');
  console.log('Data:', JSON.stringify(data, null, 2));
  
  const merchantTxnNo = data.merchantTxnNo || data.txnId || data.transactionId;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  try {
    await connectToDatabase();
    const transactions = await getCollection('transactions');
    
    if (!merchantTxnNo) {
      // No txn ID - find latest pending
      const recent = await transactions.findOne(
        { status: 'PENDING' },
        { sort: { createdAt: -1 } }
      );
      
      if (recent) {
        return createRedirectResponse(`${baseUrl}/payment/return?merchantTxnNo=${recent.merchantTxnNo}`);
      }
      
      return NextResponse.json({
        status: 'ERROR',
        message: 'No transaction ID provided',
        data: null
      }, { status: 200, headers });
    }
    
    // Find transaction
    let transaction = await transactions.findOne({ merchantTxnNo });
    
    // Process callback data if we have status info
    if (data.txnStatus || data.responseCode) {
      const statusInfo = determineStatus(data);
      
      if (transaction) {
        await transactions.updateOne(
          { merchantTxnNo },
          {
            $set: {
              status: statusInfo.status,
              iciciTxnId: statusInfo.iciciTxnId || data.txnID || data.paymentID,
              txnResponseCode: statusInfo.responseCode,
              txnRespDescription: statusInfo.description,
              paymentMethod: statusInfo.paymentMethod || data.paymentMode,
              iciciPayload: data,
              completedAt: new Date(),
              updatedAt: new Date()
            }
          }
        );
        
        // Grant access if success
        if (statusInfo.isSuccess && transaction.examId) {
          const users = await getCollection('users');
          await users.updateOne(
            { id: transaction.userId },
            { $addToSet: { purchasedExams: transaction.examId } }
          );
        }
        
        transaction = await transactions.findOne({ merchantTxnNo });
      }
    }
    
    // If still pending, verify with ICICI
    if (!transaction || transaction.status === 'PENDING') {
      const iciciResult = await checkPaymentStatus(merchantTxnNo);
      
      if (iciciResult.success && transaction) {
        await transactions.updateOne(
          { merchantTxnNo },
          {
            $set: {
              status: iciciResult.status,
              iciciTxnId: iciciResult.iciciTxnId,
              txnResponseCode: iciciResult.responseCode,
              txnRespDescription: iciciResult.responseDescription,
              iciciPayload: { ...data, iciciVerify: iciciResult.rawResponse },
              completedAt: iciciResult.status !== 'PENDING' ? new Date() : null,
              updatedAt: new Date()
            }
          }
        );
        
        if (iciciResult.status === 'SUCCESS' && transaction.examId) {
          const users = await getCollection('users');
          await users.updateOne(
            { id: transaction.userId },
            { $addToSet: { purchasedExams: transaction.examId } }
          );
        }
        
        transaction = await transactions.findOne({ merchantTxnNo });
      }
    }
    
    // Build response
    const status = transaction?.status || 'PENDING';
    const examId = transaction?.examId;
    
    // Redirect to appropriate page
    if (status === 'SUCCESS') {
      return createRedirectResponse(examId 
        ? `${baseUrl}/exams/${examId}` 
        : `${baseUrl}/payment/success?txn=${merchantTxnNo}`);
    } else if (status === 'FAILED') {
      return createRedirectResponse(`${baseUrl}/payment/failed?txn=${merchantTxnNo}`);
    }
    
    // Still pending - redirect to return page for polling
    return createRedirectResponse(`${baseUrl}/payment/return?merchantTxnNo=${merchantTxnNo}`);
    
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json({
      status: 'ERROR',
      message: error.message,
      transactionId: merchantTxnNo
    }, { status: 200, headers });
  }
}

function createRedirectResponse(url) {
  return new NextResponse(
    `<!DOCTYPE html>
<html><head>
<meta http-equiv="refresh" content="0;url=${url}">
<script>window.location.href="${url}";</script>
</head><body>
<p>Redirecting... <a href="${url}">Click here</a></p>
</body></html>`,
    { 
      status: 200, 
      headers: { 
        ...headers,
        'Content-Type': 'text/html; charset=utf-8'
      } 
    }
  );
}
