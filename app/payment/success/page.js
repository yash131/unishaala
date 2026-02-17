'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { CheckCircle, ArrowRight, Download, Home } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('txn');
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  const fetchTransaction = async () => {
    try {
      const res = await fetch('/api/payment/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      });
      const data = await res.json();
      if (data.success) {
        setTransaction(data.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="large" showText={false} />
        </div>

        <Card className="shadow-xl text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-500 mb-6">Thank you for your purchase</p>

            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            ) : transaction ? (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono text-sm">{transaction.transactionId}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="font-bold text-green-600">₹{transaction.amount}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Item</span>
                  <span className="font-medium">{transaction.itemName}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Status</span>
                  <span className="text-green-600 font-medium">✓ {transaction.status}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 mb-6">Transaction ID: {transactionId}</p>
            )}

            <div className="space-y-3">
              <Link href="/exams">
                <Button className="w-full bg-teal-600 hover:bg-teal-700">
                  Start Learning <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" /> Go to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
