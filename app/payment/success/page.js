'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import { CheckCircle, ArrowRight, Home, Copy, ChevronDown, ChevronUp, IndianRupee, Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('txn') || searchParams.get('payment_id');
  const orderId = searchParams.get('orderId');
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (transactionId || orderId) {
      fetchTransaction();
    } else {
      setLoading(false);
    }
  }, [transactionId, orderId]);

  const fetchTransaction = async () => {
    try {
      const res = await fetch('/api/payment/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setTransaction(data.data);
      }
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <Logo size="large" showText={false} />
        </div>

        <Card className="shadow-xl mb-6">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-500 mb-6">Thank you for your purchase</p>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : transaction ? (
              <>
                <Badge className="bg-green-500 text-white text-lg px-4 py-1 mb-6">
                  {transaction.status}
                </Badge>

                <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-6 mb-6 text-white">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <IndianRupee className="w-8 h-8" />
                    <span className="text-4xl font-bold">{transaction.amount}</span>
                  </div>
                  <p className="text-pink-100">Amount Paid</p>
                </div>

                <div className="text-left mb-6 space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-mono text-sm">{transaction.transactionId}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Item</span>
                    <span>{transaction.itemName}</span>
                  </div>
                  {transaction.paymentMethod && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Payment Method</span>
                      <span className="capitalize">{transaction.paymentMethod}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-gray-500">Transaction ID: {transactionId || 'N/A'}</p>
            )}

            <div className="space-y-3 mt-6">
              {transaction?.mockTestId ? (
                <Link href={`/mock-test/${transaction.mockTestId}`}>
                  <Button className="w-full bg-pink-600 hover:bg-pink-700">
                    Start Test Now <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : transaction?.examId ? (
                <Link href={`/exams/${transaction.examSlug || transaction.examId}`}>
                  <Button className="w-full bg-pink-600 hover:bg-pink-700">
                    Go to Exam <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href="/exams">
                  <Button className="w-full bg-pink-600 hover:bg-pink-700">
                    Go to Exams <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" /> Go to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {transaction?.paymentDetails && (
          <Card className="shadow-lg">
            <CardHeader
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => setShowDetails(!showDetails)}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                Payment Details
                {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </CardTitle>
            </CardHeader>
            {showDetails && (
              <CardContent>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(transaction.paymentDetails, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>
        )}

        {copied && (
          <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg">
            Copied!
          </div>
        )}
      </div>
    </div>
  );
}
