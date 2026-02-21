'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import {
  CheckCircle,
  ArrowRight,
  Home,
  Copy,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Clock,
  FileText,
  IndianRupee,
  Loader2
} from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('txn');
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayload, setShowPayload] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    } else {
      setLoading(false);
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    if (typeof dateStr === 'string' && dateStr.length === 14) {
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      const hour = dateStr.slice(8, 10);
      const min = dateStr.slice(10, 12);
      const sec = dateStr.slice(12, 14);
      return `${day}/${month}/${year} ${hour}:${min}:${sec}`;
    }
    return new Date(dateStr).toLocaleString('en-IN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="large" showText={false} />
        </div>

        {/* Success Card */}
        <Card className="shadow-xl mb-6">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-500 mb-6">Thank you for your purchase</p>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                <span className="text-gray-500">Loading transaction details...</span>
              </div>
            ) : transaction ? (
              <>
                {/* Status Badge */}
                <div className="mb-6">
                  <Badge className="bg-green-500 text-white text-lg px-4 py-1">
                    {transaction.status}
                  </Badge>
                </div>

                {/* Amount Highlight */}
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 mb-6 text-white">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <IndianRupee className="w-8 h-8" />
                    <span className="text-4xl font-bold">{transaction.amount}</span>
                  </div>
                  <p className="text-teal-100">Amount Paid</p>
                </div>
              </>
            ) : (
              <p className="text-gray-500 mb-6">Transaction ID: {transactionId || 'Not available'}</p>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
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

        {/* Transaction Details Card */}
        {transaction && (
          <Card className="shadow-lg mb-6">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-teal-600" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Transaction ID */}
                <DetailRow label="Transaction ID" value={transaction.transactionId} copyable onCopy={copyToClipboard} />

                {/* ICICI Transaction ID */}
                {transaction.iciciTransactionId && (
                  <DetailRow label="ICICI Txn ID" value={transaction.iciciTransactionId} copyable onCopy={copyToClipboard} />
                )}

                {/* Item Name */}
                <DetailRow label="Item" value={transaction.itemName || '-'} />

                {/* Amount */}
                <DetailRow label="Amount" value={`₹${transaction.amount}`} highlight />

                {/* Payment Method */}
                {transaction.paymentMethod && (
                  <DetailRow
                    label="Payment Method"
                    value={`${transaction.paymentMethod}${transaction.paymentSubInstType ? ` (${transaction.paymentSubInstType})` : ''}`}
                    icon={<CreditCard className="w-4 h-4 text-gray-400" />}
                  />
                )}

                {/* Auth ID */}
                {transaction.txnAuthID && (
                  <DetailRow label="Auth ID" value={transaction.txnAuthID} mono />
                )}

                {/* Response Code */}
                {transaction.txnResponseCode && (
                  <DetailRow label="Response Code" value={transaction.txnResponseCode} mono />
                )}

                {/* Payment DateTime */}
                {transaction.paymentDateTime && (
                  <DetailRow
                    label="Payment Time"
                    value={formatDateTime(transaction.paymentDateTime)}
                    icon={<Clock className="w-4 h-4 text-gray-400" />}
                  />
                )}

                {/* Created At */}
                <DetailRow label="Created" value={formatDateTime(transaction.createdAt)} />

                {/* Status */}
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-500 font-medium">Status</span>
                  <Badge className="bg-green-500 text-white">{transaction.status}</Badge>
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
                  <FileText className="w-5 h-5 text-teal-600" />
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
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96">
                  {JSON.stringify(transaction.iciciPayload, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>
        )}

        {/* Copied Toast */}
        {copied && (
          <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
            Copied to clipboard!
          </div>
        )}

        {/* Footer Note */}
        <p className="text-center text-gray-400 text-sm mt-8">
          If you have any issues, please contact support@unishaala.com
        </p>
      </div>
    </div>
  );
}

// Detail Row Component
function DetailRow({ label, value, copyable, onCopy, icon, highlight, mono }) {
  return (
    <div className="flex justify-between items-center py-3 border-b last:border-0">
      <span className="text-gray-500 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {icon}
        <span className={`${highlight ? 'font-bold text-green-600' : ''} ${mono ? 'font-mono text-sm bg-gray-100 px-2 py-1 rounded' : ''}`}>
          {value}
        </span>
        {copyable && onCopy && (
          <button onClick={() => onCopy(value)} className="p-1 hover:bg-gray-100 rounded">
            <Copy className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}
