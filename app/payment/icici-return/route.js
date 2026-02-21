import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/db';

// This route handler receives the POST from ICICI and redirects to the success/failed page
export async function POST(request) {
  try {
    await connectToDatabase();
    const transactions = await getCollection('transactions');
    
    // Parse form data from ICICI
    let formDataObj = {};
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        formDataObj[key] = value;
      }
    } else {
      // Try JSON
      formDataObj = await request.json().catch(() => ({}));
    }
    
    console.log('=== ICICI RETURN (Page Route) ===');
    console.log('Payload:', JSON.stringify(formDataObj, null, 2));
    console.log('=================================');
    
    const {
      merchantTxnNo,
      txnID,
      txnStatus,
      responseCode,
      respDescription,
      amount,
      paymentMode,
      authCode,
      paymentDateTime,
      paymentSubInstType,
      oth_charge,
      paymentID,
    } = formDataObj;

    // Get base URL for redirect
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_BASE_URL;

    if (!merchantTxnNo) {
      console.error('No merchantTxnNo in ICICI return');
      return NextResponse.redirect(`${baseUrl}/payment/failed?reason=Invalid%20response`);
    }

    // Find and update transaction
    const transaction = await transactions.findOne({ merchantTxnNo });
    
    if (!transaction) {
      console.error('Transaction not found:', merchantTxnNo);
      return NextResponse.redirect(`${baseUrl}/payment/failed?reason=Transaction%20not%20found&txn=${merchantTxnNo}`);
    }

    // Determine status
    const isSuccess = txnStatus === 'SUC' || responseCode === '0000';
    const status = isSuccess ? 'SUCCESS' : (txnStatus === 'PEN' ? 'PENDING' : 'FAILED');

    // Update transaction
    await transactions.updateOne(
      { merchantTxnNo },
      {
        $set: {
          status,
          iciciTransactionId: txnID || paymentID || null,
          txnAuthID: authCode || null,
          txnResponseCode: responseCode || null,
          txnRespDescription: respDescription || null,
          paymentMethod: paymentMode || null,
          paymentSubInstType: paymentSubInstType || null,
          paymentDateTime: paymentDateTime || null,
          otherCharges: oth_charge || null,
          iciciPayload: formDataObj,
          gatewayResponse: formDataObj,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // If success, grant access
    if (isSuccess && transaction.examId) {
      const users = await getCollection('users');
      await users.updateOne(
        { id: transaction.userId },
        { $addToSet: { purchasedExams: transaction.examId } }
      );
    }

    // Redirect to success or failed page
    const redirectUrl = isSuccess 
      ? `${baseUrl}/payment/success?txn=${merchantTxnNo}`
      : `${baseUrl}/payment/failed?txn=${merchantTxnNo}&reason=${encodeURIComponent(respDescription || 'Payment failed')}`;

    // Return HTML with redirect to avoid 403 issues
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <title>Redirecting...</title>
</head>
<body>
  <p>Processing payment... <a href="${redirectUrl}">Click here</a> if not redirected.</p>
  <script>window.location.href="${redirectUrl}";</script>
</body>
</html>`,
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  } catch (error) {
    console.error('Payment return error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    return NextResponse.redirect(`${baseUrl}/payment/failed?reason=Processing%20error`);
  }
}

// Handle GET requests (for query param based callbacks)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const merchantTxnNo = searchParams.get('merchantTxnNo') || searchParams.get('txnId');
  
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_BASE_URL;
  
  if (merchantTxnNo) {
    // Process the callback
    await connectToDatabase();
    const transactions = await getCollection('transactions');
    const transaction = await transactions.findOne({ merchantTxnNo });
    
    if (transaction) {
      if (transaction.status === 'SUCCESS') {
        return NextResponse.redirect(`${baseUrl}/payment/success?txn=${merchantTxnNo}`);
      } else {
        return NextResponse.redirect(`${baseUrl}/payment/failed?txn=${merchantTxnNo}`);
      }
    }
  }
  
  // Redirect to failed if no transaction found
  return NextResponse.redirect(`${baseUrl}/payment/failed?reason=Invalid%20request`);
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
