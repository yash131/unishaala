'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentReturnPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Verifying your payment...');
  const [attempts, setAttempts] = useState(0);
  
  useEffect(() => {
    let isMounted = true;
    let pollCount = 0;
    
    async function checkPayment() {
      if (!isMounted) return;
      
      pollCount++;
      setAttempts(pollCount);
      
      // Get txn from URL if available
      const txnFromUrl = searchParams.get('merchantTxnNo') || searchParams.get('txnId');
      
      try {
        // First try to get latest pending transaction for this user
        const latestRes = await fetch('/api/payment/latest', { credentials: 'include' });
        const latestData = await latestRes.json();
        
        const merchantTxnNo = txnFromUrl || latestData?.data?.merchantTxnNo;
        
        if (!merchantTxnNo) {
          if (pollCount < 5) {
            setStatus('Looking for your transaction...');
            setTimeout(checkPayment, 2000);
            return;
          }
          // No transaction found after retries - redirect to exams
          window.location.href = '/exams';
          return;
        }
        
        setStatus(`Verifying transaction ${merchantTxnNo}...`);
        
        // Check status with ICICI verification
        const statusRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantTxnNo }),
          credentials: 'include'
        });
        
        const statusData = await statusRes.json();
        
        if (statusData.success && statusData.data) {
          const txnStatus = statusData.data.status;
          
          if (txnStatus === 'SUCCESS') {
            // Redirect to exam page directly
            const examId = statusData.data.examId;
            if (examId) {
              window.location.href = `/exams/${examId}`;
            } else {
              window.location.href = `/payment/success?txn=${merchantTxnNo}`;
            }
            return;
          } else if (txnStatus === 'FAILED') {
            window.location.href = `/payment/failed?txn=${merchantTxnNo}&reason=${encodeURIComponent(statusData.data.txnRespDescription || 'Payment failed')}`;
            return;
          }
        }
        
        // Still pending - keep polling (max 15 attempts = 30 seconds)
        if (pollCount < 15) {
          setStatus(`Payment processing... (${pollCount}/15)`);
          setTimeout(checkPayment, 2000);
        } else {
          // Timeout - show manual check option
          setStatus('Taking longer than expected...');
          setTimeout(() => {
            window.location.href = `/payment/success?txn=${merchantTxnNo}`;
          }, 2000);
        }
      } catch (error) {
        console.error('Payment check error:', error);
        if (pollCount < 15) {
          setTimeout(checkPayment, 2000);
        } else {
          window.location.href = '/exams';
        }
      }
    }
    
    // Start checking after a brief delay
    setTimeout(checkPayment, 1000);
    
    return () => { isMounted = false; };
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
          width: '60px',
          height: '60px',
          margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '24px'
        }}>U</div>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #14b8a6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <h1 style={{ color: '#1f2937', marginBottom: '10px', fontSize: '24px' }}>Processing Payment</h1>
        <p style={{ color: '#6b7280', marginBottom: '10px' }}>{status}</p>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Please wait, do not close this page</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
