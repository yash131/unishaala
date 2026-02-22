'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentReturnPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing payment...');
  
  useEffect(() => {
    const merchantTxnNo = searchParams.get('merchantTxnNo') || searchParams.get('txnId');
    
    async function processPayment() {
      // Collect all URL params
      const params = {};
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
      
      console.log('Payment return params:', params);
      
      if (merchantTxnNo) {
        setStatus('Verifying payment...');
        
        // Process callback if we have data
        if (Object.keys(params).length > 1) {
          try {
            await fetch('/api/payment/process-callback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params)
            });
          } catch (e) {
            console.log('Process callback error:', e);
          }
        }
        
        // Check status and redirect
        try {
          const res = await fetch('/api/payment/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId: merchantTxnNo })
          });
          const data = await res.json();
          
          if (data.success && data.data) {
            if (data.data.status === 'SUCCESS') {
              window.location.href = `/payment/success?txn=${merchantTxnNo}`;
            } else {
              window.location.href = `/payment/failed?txn=${merchantTxnNo}&reason=${encodeURIComponent(data.data.txnRespDescription || 'Payment failed')}`;
            }
            return;
          }
        } catch (e) {
          console.log('Status check error:', e);
        }
        
        // Fallback - redirect to success page to check
        window.location.href = `/payment/success?txn=${merchantTxnNo}`;
      } else {
        // No txn ID - check latest transaction
        try {
          const res = await fetch('/api/payment/latest');
          const data = await res.json();
          if (data.success && data.data) {
            window.location.href = `/payment/success?txn=${data.data.merchantTxnNo}`;
            return;
          }
        } catch (e) {}
        
        setStatus('No transaction found. Redirecting...');
        setTimeout(() => { window.location.href = '/exams'; }, 2000);
      }
    }
    
    processPayment();
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #14b8a6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <h1 style={{ color: '#1f2937', marginBottom: '10px' }}>Processing Payment</h1>
        <p style={{ color: '#6b7280' }}>{status}</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
