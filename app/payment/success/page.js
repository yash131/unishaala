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
  IndianRupee
} from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('txn');
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayload, setShowPayload] = useState(false);

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
    toast.success('Copied to clipboard!');
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    // Handle ICICI format: 20251223145516
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-500 text-white">SUCCESS</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500 text-white">PENDING</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500 text-white">FAILED</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
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
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ) : transaction ? (
              <>
                {/* Status Badge */}
                <div className="mb-6">
                  {getStatusBadge(transaction.status)}
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
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-500 font-medium">Transaction ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                      {transaction.transactionId}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(transaction.transactionId)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* ICICI Transaction ID */}
                {transaction.iciciTransactionId && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-500 font-medium">ICICI Txn ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                        {transaction.iciciTransactionId}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(transaction.iciciTransactionId)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Order ID */}
                {transaction.orderId && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-500 font-medium">Order ID</span>
                    <span className="font-mono text-sm">{transaction.orderId}</span>
                  </div>
                )}

                {/* Item Name */}
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-500 font-medium">Item</span>
                  <span className="font-medium text-gray-900">{transaction.itemName || '-'}</span>
                </div>

                {/* Amount */}
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-500 font-medium">Amount</span>
                  <span className="font-bold text-green-600">₹{transaction.amount}</span>
                </div>

                {/* Other Charges */}
                {transaction.otherCharges && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-500 font-medium">Other Charges</span>
                    <span className="text-gray-600">₹{transaction.otherCharges}</span>
                  </div>
                )}

                {/* Payment Method */}
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-500 font-medium">Payment Method</span>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {transaction.paymentMethod || '-'}
                      {transaction.paymentSubInstType && (
                        <span className="text-gray-400 text-sm ml-1">
                          ({transaction.paymentSubInstType})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Auth ID */}
                {transaction.txnAuthID && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-500 font-medium">Auth ID</span>
                    <span className="font-mono text-sm">{transaction.txnAuthID}</span>
                  </div>
                )}

                {/* Response Code */}
                {transaction.txnResponseCode && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-500 font-medium">Response Code</span>
                    <Badge variant="outline" className="font-mono">
                      {transaction.txnResponseCode}
                    </Badge>
                  </div>
                )}

                {/* Payment DateTime */}
                {transaction.paymentDateTime && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-500 font-medium">Payment Time</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{formatDateTime(transaction.paymentDateTime)}</span>
                    </div>
                  </div>
                )}

                {/* Created At */}
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-500 font-medium">Created</span>
                  <span>{formatDateTime(transaction.createdAt)}</span>
                </div>

                {/* Completed At */}
                {transaction.completedAt && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-500 font-medium">Completed</span>
                    <span>{formatDateTime(transaction.completedAt)}</span>
                  </div>
                )}

                {/* Status */}
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-500 font-medium">Status</span>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ICICI Raw Payload Card */}
        {transaction && transaction.iciciPayload && (
          <Card className="shadow-lg">
            <CardHeader 
              className="border-b bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setShowPayload(!showPayload)}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  ICICI Payment Response (Raw JSON)
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
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                  {JSON.stringify(transaction.iciciPayload, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>
        )}

        {/* Footer Note */}
        <p className="text-center text-gray-400 text-sm mt-8">
          If you have any issues, please contact support@unishaala.com
        </p>
      </div>
    </div>
  );
}
