import Link from 'next/link';
import { MainNavbar } from '@/components/MainNavbar';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Unishaala',
  description: 'Learn how Unishaala collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last Updated: March 1, 2025</p>
          </header>

          {/* Content */}
          <article className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed mb-8">
              At Unishaala, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>

            {/* Section 1 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Personal Information</h3>
              <p className="text-gray-600 mb-4">When you create an account or use our services, we may collect:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Name and email address</li>
                <li>Phone number</li>
                <li>Profile information</li>
                <li>Educational background and preferences</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Usage Data</h3>
              <p className="text-gray-600 mb-4">We automatically collect information about how you interact with our platform:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Test attempts and scores</li>
                <li>Time spent on different sections</li>
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Payment Information</h3>
              <p className="text-gray-600 mb-4">
                When you make purchases, payment information is processed securely through our payment partners (Razorpay). We do not store complete credit card numbers or CVV codes on our servers.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Information</h2>
              <p className="text-gray-600 mb-4">We use the collected information to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide and maintain our services</li>
                <li>Personalize your learning experience</li>
                <li>Process transactions and send related information</li>
                <li>Send administrative information, updates, and promotional content</li>
                <li>Analyze usage patterns to improve our platform</li>
                <li>Detect and prevent fraudulent activities</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Sharing</h2>
              <p className="text-gray-600 mb-4">
                <strong className="text-gray-900">We do not sell your personal data to third parties.</strong>
              </p>
              <p className="text-gray-600 mb-4">We may share your information only in the following circumstances:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>With service providers who assist in operating our platform</li>
                <li>When required by law or to protect our legal rights</li>
                <li>In connection with a merger, acquisition, or sale of assets</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-600 mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>All data transmission is encrypted using HTTPS/TLS protocols</li>
                <li>Passwords are hashed and stored securely</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure data storage with encryption at rest</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Rights</h2>
              <p className="text-gray-600 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Update:</strong> Correct inaccurate or incomplete information</li>
                <li><strong>Delete:</strong> Request deletion of your account and associated data</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>
              <p className="text-gray-600 mt-4">
                To exercise any of these rights, please contact us at support@unishaala.com.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies</h2>
              <p className="text-gray-600 mb-4">
                We use cookies and similar tracking technologies to enhance your experience:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Essential cookies:</strong> Required for platform functionality</li>
                <li><strong>Analytics cookies:</strong> Help us understand usage patterns</li>
                <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="text-gray-600 mt-4">
                You can control cookies through your browser settings, though disabling certain cookies may affect platform functionality.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Third-Party Links</h2>
              <p className="text-gray-600">
                Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Details</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions or concerns about this Privacy Policy, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> support@unishaala.com</p>
                <p className="text-gray-700 mt-2"><strong>Address:</strong> New Delhi, India</p>
              </div>
            </section>

            {/* Changes Notice */}
            <section className="border-t border-gray-200 pt-8 mt-12">
              <p className="text-sm text-gray-500">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
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
