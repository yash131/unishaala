import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/db';
import { parseCallback, determineStatus } from '@/lib/icici';

// Handle both GET and POST callbacks from ICICI
export async function GET(request) {
  return handleCallback(request);
}

export async function POST(request) {
  return handleCallback(request);
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

async function handleCallback(request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  try {
    await connectToDatabase();
    const transactions = await getCollection('transactions');

    // Parse callback data (handles both form-data and JSON)
    let callbackData = {};
    
    // Check URL params first (for GET redirects)
    const url = new URL(request.url);
    for (const [key, value] of url.searchParams.entries()) {
      callbackData[key] = value;
    }

    // If POST, also parse body
    if (request.method === 'POST') {
      const bodyData = await parseCallback(request);
      callbackData = { ...callbackData, ...bodyData };
    }

    console.log('=== ICICI Callback Received ===');
    console.log('Method:', request.method);
    console.log('Data:', JSON.stringify(callbackData, null, 2));

    const merchantTxnNo = callbackData.merchantTxnNo;

    if (!merchantTxnNo) {
      console.error('No merchantTxnNo in callback');
      return createRedirectResponse(`${baseUrl}/payment/failed?reason=${encodeURIComponent('Invalid payment response - no transaction ID')}`);
    }

    // Find transaction
    const transaction = await transactions.findOne({ merchantTxnNo });

    if (!transaction) {
      console.error('Transaction not found:', merchantTxnNo);
      return createRedirectResponse(`${baseUrl}/payment/failed?reason=${encodeURIComponent('Transaction not found')}&txn=${merchantTxnNo}`);
    }

    // Determine status from callback
    const statusInfo = determineStatus(callbackData);
    console.log('Status determined:', statusInfo);

    // Update transaction with full callback data
    await transactions.updateOne(
      { merchantTxnNo },
      {
        $set: {
          status: statusInfo.status,
          iciciTxnId: statusInfo.iciciTxnId,
          txnAuthID: statusInfo.authCode,
          txnResponseCode: statusInfo.responseCode,
          txnRespDescription: statusInfo.description,
          paymentMethod: statusInfo.paymentMethod,
          paymentSubInstType: statusInfo.paymentSubType,
          paymentDateTime: statusInfo.paymentDateTime,
          otherCharges: statusInfo.otherCharges,
          iciciPayload: callbackData,
          gatewayResponse: callbackData,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Grant access if successful
    if (statusInfo.isSuccess && transaction.examId) {
      const users = await getCollection('users');
      await users.updateOne(
        { id: transaction.userId },
        { $addToSet: { purchasedExams: transaction.examId } }
      );
      console.log('Access granted for exam:', transaction.examId);
    }

    // Redirect to appropriate page
    const redirectUrl = statusInfo.isSuccess
      ? `${baseUrl}/payment/success?txn=${merchantTxnNo}`
      : `${baseUrl}/payment/failed?txn=${merchantTxnNo}&reason=${encodeURIComponent(statusInfo.description || 'Payment failed')}`;

    console.log('Redirecting to:', redirectUrl);
    return createRedirectResponse(redirectUrl);

  } catch (error) {
    console.error('Callback processing error:', error);
    return createRedirectResponse(`${baseUrl}/payment/failed?reason=${encodeURIComponent('Processing error')}`);
  }
}

// Create HTML redirect response (avoids 403 issues with direct redirects)
function createRedirectResponse(url) {
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${url}">
  <title>Processing Payment...</title>
  <style>
    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); }
    .container { text-align: center; padding: 40px; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #14b8a6; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    p { color: #666; font-size: 16px; }
    a { color: #14b8a6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p>Processing your payment...</p>
    <p><a href="${url}">Click here if not redirected</a></p>
  </div>
  <script>window.location.href="${url}";</script>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
