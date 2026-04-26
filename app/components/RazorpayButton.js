'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function RazorpayButton({ examId, mockTestId, amount, buttonText = 'Buy Now', onSuccess, onFailure }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Create order
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, mockTestId, amount }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      const { orderId, keyId, name, description, prefill } = data.data;

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      // Open Razorpay checkout
      const options = {
        key: keyId,
        amount: data.data.amount,
        currency: data.data.currency,
        name,
        description,
        order_id: orderId,
        prefill,
        theme: { color: '#14b8a6' },
        handler: async function (response) {
          // Verify payment
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              if (onSuccess) onSuccess(verifyData);
              // Redirect to success page or exam
              if (verifyData.data?.examId) {
                window.location.href = `/exams/${verifyData.data.examId}`;
              } else {
                window.location.href = `/payment/success?txn=${response.razorpay_payment_id}`;
              }
            } else {
              throw new Error(verifyData.error);
            }
          } catch (err) {
            if (onFailure) onFailure(err);
            window.location.href = `/payment/failed?reason=${encodeURIComponent(err.message)}`;
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        if (onFailure) onFailure(response.error);
        window.location.href = `/payment/failed?reason=${encodeURIComponent(response.error.description)}&orderId=${orderId}`;
      });
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert(error.message || 'Payment failed');
      if (onFailure) onFailure(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className="bg-rose-600 hover:bg-rose-700 text-white"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
