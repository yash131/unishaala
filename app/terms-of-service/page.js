import Link from 'next/link';
import { MainNavbar } from '@/components/MainNavbar';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Unishaala',
  description: 'Read the terms and conditions for using Unishaala\'s exam preparation platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <MainNavbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Back Link */}
          <Link href="/" className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-8 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-sm text-gray-500">Last Updated: March 1, 2025</p>
          </header>

          {/* Content */}
          <article className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed mb-8">
              Welcome to Unishaala. These Terms of Service govern your use of our website and services. By accessing or using our platform, you agree to be bound by these terms.
            </p>

            {/* Section 1 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4">
                By creating an account, accessing, or using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
              </p>
              <p className="text-gray-600">
                If you do not agree with any part of these terms, you must not use our services. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of any changes.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use of Platform</h2>
              <p className="text-gray-600 mb-4">You agree to use our platform only for lawful purposes and in accordance with these terms. You shall not:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Use the platform in any way that violates applicable laws or regulations</li>
                <li>Share your account credentials with others</li>
                <li>Attempt to gain unauthorized access to any part of the platform</li>
                <li>Copy, distribute, or reproduce any content without authorization</li>
                <li>Use automated systems or bots to access the platform</li>
                <li>Engage in any activity that disrupts or interferes with the platform</li>
                <li>Share test questions or answers with unauthorized parties</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Responsibility</h2>
              <p className="text-gray-600 mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>You must provide accurate and complete information during registration</li>
                <li>You must promptly notify us of any unauthorized use of your account</li>
                <li>You are solely responsible for any content you submit or upload</li>
                <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Services Offered</h2>
              <p className="text-gray-600 mb-4">Unishaala provides educational services including but not limited to:</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Mock Tests</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Practice tests for various competitive examinations</li>
                <li>Timed assessments simulating actual exam conditions</li>
                <li>Question banks with detailed solutions</li>
                <li>Previous year papers and topic-wise tests</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Analytics & Performance Tracking</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Detailed performance analysis and reports</li>
                <li>Progress tracking across multiple tests</li>
                <li>Rank prediction and comparison with peers</li>
                <li>Personalized recommendations for improvement</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payments & Subscriptions</h2>
              <p className="text-gray-600 mb-4">
                Certain features and content on our platform require payment. All payments are processed securely through our payment partners.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Payment Processing</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Payments are processed through Razorpay and other authorized payment gateways</li>
                <li>All prices are displayed in Indian Rupees (INR) unless otherwise specified</li>
                <li>You agree to pay all charges at the prices in effect at the time of purchase</li>
                <li>Payment information is handled securely in accordance with PCI-DSS standards</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Subscription Terms</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Access to purchased content is granted upon successful payment</li>
                <li>Subscription validity and features vary by plan</li>
                <li>We reserve the right to modify pricing with reasonable notice</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Refund Policy</h2>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
                <p className="text-amber-800 font-medium">
                  All purchases are non-refundable by default.
                </p>
              </div>
              <p className="text-gray-600 mb-4">Refunds may be considered in the following exceptional circumstances:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Technical issues preventing access to purchased content (verified by our team)</li>
                <li>Duplicate payments made in error</li>
                <li>Service not delivered as described</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Refund requests must be submitted within 7 days of purchase to support@unishaala.com. Each request will be reviewed on a case-by-case basis.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-600 mb-4">
                All content on the platform, including but not limited to text, graphics, logos, images, questions, solutions, and software, is the property of Unishaala or its content suppliers and is protected by intellectual property laws.
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>You may not copy, modify, distribute, or reproduce any content without written permission</li>
                <li>You may not use our trademarks or branding without authorization</li>
                <li>Content is licensed for personal, non-commercial use only</li>
                <li>Any unauthorized use may result in account termination and legal action</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                To the maximum extent permitted by law, Unishaala shall not be liable for:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Any indirect, incidental, special, or consequential damages</li>
                <li>Loss of profits, data, or other intangible losses</li>
                <li>Service interruptions or technical failures beyond our control</li>
                <li>Actions of third parties or external links</li>
                <li>Your exam results or outcomes based on using our platform</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Our platform is provided "as is" without warranties of any kind, either express or implied.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-600 mb-4">
                We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that we believe:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Violates these Terms of Service</li>
                <li>Is harmful to other users or the platform</li>
                <li>Is fraudulent or illegal</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Upon termination, your right to use the platform will immediately cease. Any provisions that by their nature should survive termination shall remain in effect.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Governing Law</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700">
                  These Terms of Service shall be governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts located in <strong>New Delhi, India</strong>.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> support@unishaala.com</p>
                <p className="text-gray-700 mt-2"><strong>Address:</strong> New Delhi, India</p>
              </div>
            </section>

            {/* Changes Notice */}
            <section className="border-t border-gray-200 pt-8 mt-12">
              <p className="text-sm text-gray-500">
                We may update these Terms of Service from time to time. We will notify you of any material changes by posting the new terms on this page and updating the "Last Updated" date. Your continued use of the platform after any changes constitutes acceptance of the new terms.
              </p>
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
            <Link href="/terms-of-service" className="hover:text-gray-600">Terms of Service</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
