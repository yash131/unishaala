'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ICICIReturnPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your payment...');
  const [payloadData, setPayloadData] = useState(null);
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double processing
    if (processedRef.current) return;
    processedRef.current = true;

    // Collect all data from URL params (ICICI might send as GET params)
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Also try to get data from the URL hash (some gateways use this)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      hashParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    // Try to extract data from form submission (if page was loaded via POST)
    // This is a workaround - we'll check if there's any payment data in sessionStorage
    const storedPayment = sessionStorage.getItem('icici_payment_data');
    if (storedPayment) {
      try {
        const storedData = JSON.parse(storedPayment);
        Object.assign(params, storedData);
        sessionStorage.removeItem('icici_payment_data');
      } catch (e) {}
    }

    console.log('Payment return params:', params);

    if (params.merchantTxnNo || params.txnId) {
      // We have transaction data from ICICI
      processPaymentData(params);
    } else {
      // No params - check latest transaction status via API
      checkLatestPaymentStatus();
    }
  }, []);

  const processPaymentData = async (params) => {
    setMessage('Verifying payment with bank...');
    setPayloadData(params);

    try {
      // Send the ICICI response data to our API for processing
      const response = await fetch('/api/payment/process-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      const result = await response.json();

      if (result.success) {
        if (result.status === 'SUCCESS') {
          setStatus('success');
          setMessage('Payment successful!');
          setTimeout(() => {
            window.location.href = `/payment/success?txn=${params.merchantTxnNo || params.txnId}`;
          }, 1500);
        } else {
          setStatus('failed');
          setMessage(result.error || 'Payment failed');
          setTimeout(() => {
            window.location.href = `/payment/failed?txn=${params.merchantTxnNo}&reason=${encodeURIComponent(result.error || 'Payment failed')}`;
          }, 1500);
        }
      } else {
        // API call failed, but we have payload data - show it and redirect
        setStatus('failed');
        setMessage('Could not verify payment. Please check your email for confirmation.');
        setTimeout(() => {
          window.location.href = `/payment/failed?txn=${params.merchantTxnNo}&reason=Verification%20failed`;
        }, 3000);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setStatus('failed');
      setMessage('Error verifying payment. Please check your email.');
      setTimeout(() => {
        window.location.href = '/payment/failed?reason=Processing%20error';
      }, 3000);
    }
  };

  const checkLatestPaymentStatus = async () => {
    setMessage('Checking payment status...');
    
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkStatus = async () => {
      attempts++;
      
      try {
        const response = await fetch('/api/payment/check-status-by-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        const result = await response.json();

        if (result.success && result.transaction) {
          setPayloadData(result.transaction.iciciPayload || result.transaction);
          
          if (result.transaction.status === 'SUCCESS') {
            setStatus('success');
            setMessage('Payment successful!');
            setTimeout(() => {
              window.location.href = `/payment/success?txn=${result.transaction.merchantTxnNo}`;
            }, 1500);
            return;
          } else if (result.transaction.status === 'FAILED') {
            setStatus('failed');
            setMessage('Payment failed');
            setTimeout(() => {
              window.location.href = `/payment/failed?txn=${result.transaction.merchantTxnNo}`;
            }, 1500);
            return;
          }
        }

        // Still pending or not found, try again
        if (attempts < maxAttempts) {
          setMessage(`Verifying payment... (attempt ${attempts}/${maxAttempts})`);
          setTimeout(checkStatus, 2000);
        } else {
          setStatus('timeout');
          setMessage('Payment verification timed out. Please check your email or contact support.');
        }
      } catch (error) {
        console.error('Error checking status:', error);
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        } else {
          setStatus('error');
          setMessage('Could not verify payment status. Please check your email.');
        }
      }
    };

    checkStatus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-lg w-full">
        {status === 'processing' && (
          <Loader2 className="w-16 h-16 text-teal-600 animate-spin mx-auto mb-4" />
        )}
        {status === 'success' && (
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        )}
        {status === 'failed' && (
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        )}
        
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          {status === 'processing' ? 'Processing Payment' : 
           status === 'success' ? 'Payment Successful' : 'Payment Status'}
        </h1>
        <p className="text-gray-600 mb-4">{message}</p>
        
        {payloadData && (
          <div className="mt-6 text-left">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Response:</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-60 text-left">
              {JSON.stringify(payloadData, null, 2)}
            </pre>
          </div>
        )}
        
        <p className="text-sm text-gray-400 mt-6">Please do not close this window</p>
        
        <div className="mt-4 space-x-4">
          <a href="/" className="text-teal-600 hover:underline text-sm">Go to Home</a>
          <a href="/exams" className="text-teal-600 hover:underline text-sm">Browse Exams</a>
        </div>
      </div>
    </div>
  );
}
