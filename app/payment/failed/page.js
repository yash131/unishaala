'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { XCircle, RefreshCw, Home, Phone } from 'lucide-react';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'Payment could not be processed';
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <Logo size="large" showText={false} />
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-500 mb-4">We couldn't process your payment</p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">
                <strong>Reason:</strong> {decodeURIComponent(reason)}
              </p>
              {orderId && (
                <p className="text-red-600 text-xs mt-2">Order ID: {orderId}</p>
              )}
            </div>

            <div className="space-y-3">
              <Link href="/exams">
                <Button className="w-full bg-pink-600 hover:bg-pink-700">
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
      </div>
    </div>
  );
}
