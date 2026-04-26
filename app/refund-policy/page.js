import Link from 'next/link';
import { MainNavbar } from '@/components/MainNavbar';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Refund & Payment Policy | Unishaala',
  description: 'Learn about Unishaala\'s refund and cancellation policies for courses and subscriptions.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <MainNavbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Back Link */}
          <Link href="/" className="inline-flex items-center text-brand-600 hover:text-brand-700 mb-8 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund & Payment Policy</h1>
            <p className="text-sm text-gray-500">Effective Date: 1 March, 2026</p>
          </header>

          {/* Content */}
          <article className="max-w-none">
            
            <section className="mb-10">
              <p className="text-gray-600 mb-6 text-lg text-justify">
                At Unishaala, we strive to ensure a high-quality learning experience for all users. This Refund and Cancellation Policy outlines the terms under which users may request refunds or cancel purchases made on the Platform.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Purchase Agreement</h2>
              <p className="text-gray-600 mb-4 text-justify">
                When you purchase a course or subscription on Unishaala, you agree to the pricing, payment terms, and applicable refund conditions displayed at the time of purchase.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Eligibility</h2>
              <p className="text-gray-600 mb-4 text-justify">
                Refund eligibility may vary depending on the nature of the course, including whether it is a live class, recorded content, or part of a bundled offering. In general:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li className="text-justify">Users may request a refund within a limited period from the date of purchase, provided that the course has not been substantially consumed.</li>
                <li className="text-justify">A course may be considered "substantially consumed" if a significant portion of the content has been accessed or completed.</li>
                <li className="text-justify">For live classes, refunds may not be available once the session has commenced or been attended.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
              <p className="text-gray-600 mb-4 text-justify">
                Refund requests must be submitted through the official support channels of Unishaala and will be reviewed on a case-by-case basis. Approved refunds will be processed using the original payment method within a reasonable timeframe, subject to applicable banking or payment provider processing times.
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700">
                  <strong>Contact for Refund Requests:</strong><br />
                  Email: <a href="mailto:admin@unishaala.com" className="text-brand-600 hover:underline">admin@unishaala.com</a>
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Subscription Cancellations</h2>
              <p className="text-gray-600 mb-4 text-justify">
                Subscriptions, where applicable, may be canceled at any time; however, cancellation will typically take effect at the end of the current billing cycle, and partial refunds for unused periods may not be provided unless explicitly stated otherwise.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Denial</h2>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala reserves the right to deny refund requests in cases of:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Misuse or abuse of the refund policy</li>
                <li>Violations of the Terms of Service</li>
                <li>Fraudulent purchase activity</li>
                <li>Substantial consumption of course content</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Policy Updates</h2>
              <p className="text-gray-600 mb-4 text-justify">
                We reserve the right to modify this policy at any time, with updates being posted on the Platform. Continued use of our services after policy changes constitutes acceptance of the revised terms.
              </p>
            </section>

            <section className="pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-4 text-justify">
                For any refund or cancellation-related queries, users may contact us at:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> <a href="mailto:admin@unishaala.com" className="text-brand-600 hover:underline">admin@unishaala.com</a></p>
              </div>
            </section>

          </article>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-gray-50 py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">&copy; 2025 Unishaala. All rights reserved.</p>
          <p className="mt-2 text-xs text-gray-400">
            <Link href="/privacy-policy" className="hover:text-gray-600">Privacy Policy</Link>
            <span className="mx-2">•</span>
            <Link href="/terms-of-service" className="hover:text-gray-600">Terms & Conditions</Link>
            <span className="mx-2">•</span>
            <Link href="/refund-policy" className="hover:text-gray-600">Refund Policy</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
