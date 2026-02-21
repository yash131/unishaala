'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ICICIReturnPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    // Get all query params (for GET-based callbacks)
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // If we have merchantTxnNo in query params, process it
    if (params.merchantTxnNo || params.txnId) {
      processPaymentResponse(params);
    } else {
      // Check if there's form data in the URL hash or try to get from server
      checkPaymentStatus();
    }
  }, [searchParams]);

  const processPaymentResponse = async (params) => {
    try {
      const response = await fetch('/api/payment/process-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      const data = await response.json();
      
      if (data.success) {
        window.location.href = `/payment/success?txn=${params.merchantTxnNo || params.txnId}`;
      } else {
        window.location.href = `/payment/failed?txn=${params.merchantTxnNo || params.txnId}&reason=${encodeURIComponent(data.error || 'Payment processing failed')}`;
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error processing payment. Redirecting...');
      setTimeout(() => {
        window.location.href = '/payment/failed?reason=Processing%20error';
      }, 2000);
    }
  };

  const checkPaymentStatus = async () => {
    // Try to get the most recent pending transaction for this session
    setMessage('Verifying payment status...');
    
    try {
      const response = await fetch('/api/payment/check-latest');
      const data = await response.json();
      
      if (data.success && data.transaction) {
        if (data.transaction.status === 'SUCCESS') {
          window.location.href = `/payment/success?txn=${data.transaction.merchantTxnNo}`;
        } else if (data.transaction.status === 'FAILED') {
          window.location.href = `/payment/failed?txn=${data.transaction.merchantTxnNo}`;
        } else {
          // Still pending, show message
          setMessage('Payment is being processed. Please wait...');
          // Poll again after 3 seconds
          setTimeout(checkPaymentStatus, 3000);
        }
      } else {
        setStatus('error');
        setMessage('Could not verify payment status.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error checking payment status.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          {status === 'processing' ? 'Processing Payment' : 'Payment Status'}
        </h1>
        <p className="text-gray-600">{message}</p>
        <p className="text-sm text-gray-400 mt-4">Please do not close this window</p>
      </div>
    </div>
  );
}
