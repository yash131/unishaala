'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import {
  XCircle,
  RefreshCw,
  Home,
  Phone,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2
} from 'lucide-react';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('txn');
  const reason = searchParams.get('reason') || 'Payment could not be processed';
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(!!transactionId);
  const [showPayload, setShowPayload] = useState(false);
  const [copied, setCopied] = useState(false);

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
      console.error('Error fetching transaction:', e);
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="large" showText={false} />
        </div>

        {/* Failed Card */}
        <Card className="shadow-xl mb-6">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-500 mb-4">We couldn't process your payment</p>

            {/* Error Details */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-red-700 text-sm">
                <strong>Reason:</strong> {decodeURIComponent(reason)}
              </p>
              {transactionId && (
                <p className="text-red-600 text-xs mt-2">
                  Transaction ID: {transactionId}
                </p>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                <span className="text-gray-500 text-sm">Loading details...</span>
              </div>
            )}

            {transaction && (
              <div className="mb-6">
                <Badge className="bg-red-500 text-white">{transaction.status}</Badge>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/exams">
                <Button className="w-full bg-teal-600 hover:bg-teal-700">
                  <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" /> Go to Home
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" className="w-full text-gray-600">
                  <Phone className="w-4 h-4 mr-2" /> Contact Support
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-400 mt-6">
              If amount was debited, it will be refunded within 5-7 business days.
            </p>
          </CardContent>
        </Card>

        {/* Transaction Details Card */}
        {transaction && (
          <Card className="shadow-lg mb-6">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-red-600" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono">{transaction.transactionId}</span>
                </div>
                {transaction.amount && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-medium">₹{transaction.amount}</span>
                  </div>
                )}
                {transaction.txnResponseCode && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Response Code</span>
                    <span className="font-mono bg-red-100 px-2 py-1 rounded text-red-700">
                      {transaction.txnResponseCode}
                    </span>
                  </div>
                )}
                {transaction.txnRespDescription && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Description</span>
                    <span className="text-red-600">{transaction.txnRespDescription}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Status</span>
                  <Badge className="bg-red-500 text-white">{transaction.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ICICI Raw Payload Card */}
        {transaction?.iciciPayload && (
          <Card className="shadow-lg">
            <CardHeader
              className="border-b bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setShowPayload(!showPayload)}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Complete ICICI Response (Raw JSON)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(JSON.stringify(transaction.iciciPayload, null, 2));
                    }}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Copy JSON"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                  {showPayload ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            {showPayload && (
              <CardContent className="p-4">
                <pre className="bg-gray-900 text-red-400 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96">
                  {JSON.stringify(transaction.iciciPayload, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>
        )}

        {/* Copied Toast */}
        {copied && (
          <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg">
            Copied to clipboard!
          </div>
        )}

        {/* Footer Note */}
        <p className="text-center text-gray-400 text-sm mt-8">
          Need help? Contact support@unishaala.com
        </p>
      </div>
    </div>
  );
}
