import Link from 'next/link';
import { MainNavbar } from '@/components/MainNavbar';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy & Data Policy | Unishaala',
  description: 'Learn how Unishaala collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <MainNavbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Back Link */}
          <Link href="/" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-8 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy & Data Policy</h1>
            <p className="text-sm text-gray-500">Effective Date: 1 March 2026</p>
          </header>

          {/* Content */}
          <article className="max-w-none">
            
            {/* Privacy Policy */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Privacy Policy</h2>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala is committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit and use unishaala.com (the "Platform").
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                When you use the Platform, we may collect personal information such as your name, email address, phone number, and payment details, as well as non-personal information including device data, browser type, IP address, and usage patterns. This information is collected either directly from you when you register or interact with the Platform, or automatically through technologies such as cookies and analytics tools.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                The information we collect is used to provide, operate, and improve our services. This includes facilitating course access, processing transactions, personalizing user experience, communicating important updates, and analyzing user behavior to enhance the Platform. We may also use your information to send promotional or informational communications, which you can opt out of at any time.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                <strong>We do not sell your personal information to third parties.</strong> However, we may share your data with trusted service providers who assist us in operating the Platform, such as payment processors, hosting providers, and analytics services. We may also disclose information where required by law, regulation, or legal process, or where necessary to protect our rights, users, or the integrity of the Platform.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala implements reasonable technical and organizational measures to protect your personal data from unauthorized access, loss, misuse, or alteration. While we strive to safeguard your information, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                You have certain rights regarding your personal data, including the right to access, update, correct, or request deletion of your information, subject to applicable legal requirements. You may exercise these rights by contacting us using the details provided below.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                The Platform may contain links to third-party websites or services. Unishaala is not responsible for the privacy practices or content of such third parties, and users are encouraged to review their respective privacy policies.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Our services are not intended for children under the age of 13 without appropriate parental or guardian consent. We do not knowingly collect personal information from children in violation of applicable laws.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. Any updates will be posted on this page with a revised effective date.
              </p>
              <p className="text-gray-600 text-justify">
                If you have any questions, concerns, or requests regarding this Privacy Policy, you may contact us at <a href="mailto:admin@unishaala.com" className="text-pink-600 hover:underline">admin@unishaala.com</a>.
              </p>
            </section>

            {/* Data Protection & User Rights */}
            <section className="mb-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Protection & User Rights Addendum</h2>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala is committed to complying with applicable data protection laws, including the Digital Personal Data Protection Act, 2023 (India), and, where applicable, principles aligned with the General Data Protection Regulation (GDPR).
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                We process personal data only for lawful purposes, including providing services, fulfilling contractual obligations, complying with legal requirements, and pursuing legitimate business interests. Wherever required, we obtain your consent before collecting or processing your personal data.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                You, as a user ("Data Principal"), have the right to access your personal data, request correction or erasure, withdraw consent, and request grievance redressal. Requests may be submitted through our designated contact channels, and we will respond within a reasonable timeframe as required by applicable law.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala implements appropriate technical and organizational safeguards to protect personal data, including encryption, access controls, and secure storage practices. In the event of a data breach, we will take necessary steps to notify affected users and relevant authorities in accordance with applicable laws.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Where personal data is transferred to third-party service providers or processed outside your jurisdiction, we ensure that such transfers are subject to appropriate safeguards and contractual protections.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                We retain personal data only for as long as necessary to fulfill the purposes for which it was collected or as required by law. Once no longer required, data is securely deleted or anonymized.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                We have appointed a Grievance Officer / Data Protection Contact to address user concerns related to data privacy. For any such concerns, please contact <a href="mailto:admin@unishaala.com" className="text-pink-600 hover:underline">admin@unishaala.com</a>.
              </p>
              <p className="text-gray-600 text-justify">
                By continuing to use the Platform, you acknowledge and consent to the collection and processing of your data as described in this Privacy Policy and related documents.
              </p>
            </section>

            {/* Cookie Policy */}
            <section className="mb-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Policy</h2>
              <p className="text-sm text-gray-500 mb-4">Effective Date: 1 March, 2026</p>
              <p className="text-gray-600 mb-4 text-justify">
                This Cookie Policy explains how Unishaala uses cookies and similar tracking technologies when you access and use our platform available at https://unishaala.com (the "Platform"). By continuing to use the Platform, you consent to the use of cookies in accordance with this policy.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Cookies are small text files that are stored on your device when you visit a website. They help us recognize your device, remember your preferences, and improve your overall user experience. We use both session cookies, which expire when you close your browser, and persistent cookies, which remain on your device until deleted or expired.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala uses cookies for several purposes, including enabling essential website functionality, remembering user preferences, analyzing traffic and user behavior, and improving performance. We may also use cookies to personalize content and deliver relevant communications.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                In addition to our own cookies, we may allow third-party service providers, such as analytics and advertising partners, to place cookies on your device. These third parties may use cookies to collect information about your online activities across different websites and services.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                You have the ability to control or disable cookies through your browser settings. However, please note that disabling cookies may affect the functionality of certain features on the Platform and limit your user experience.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                We may update this Cookie Policy from time to time to reflect changes in technology, law, or our practices. Continued use of the Platform after such updates constitutes your acceptance of the revised policy.
              </p>
              <p className="text-gray-600 text-justify">
                For any questions regarding this Cookie Policy, please contact us at <a href="mailto:admin@unishaala.com" className="text-pink-600 hover:underline">admin@unishaala.com</a>.
              </p>
            </section>

            {/* Copyright & Intellectual Property */}
            <section className="mb-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Copyright & Intellectual Property Policy</h2>
              <p className="text-sm text-gray-500 mb-4">Effective Date: 1 March, 2026</p>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala respects the intellectual property rights of others and expects users and instructors to do the same. This policy outlines how we handle claims of copyright infringement on the Platform.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                All content available on Unishaala, including courses, videos, text, graphics, and logos, is protected by applicable copyright and intellectual property laws. Unauthorized use, reproduction, or distribution of such content is strictly prohibited.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                If you believe that any content on the Platform infringes your copyright, you may submit a notice to us with relevant details, including identification of the copyrighted work, the allegedly infringing material, and proof of ownership. Upon receiving a valid complaint, we will review the claim and take appropriate action, which may include removing or disabling access to the content.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Users or instructors who repeatedly violate intellectual property rights may have their accounts suspended or terminated. We also reserve the right to take legal action where necessary.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                If you believe your content was wrongly removed due to a mistake or misidentification, you may submit a counter-notification with supporting information.
              </p>
              <p className="text-gray-600 text-justify">
                For all copyright-related concerns, please contact <a href="mailto:admin@unishaala.com" className="text-pink-600 hover:underline">admin@unishaala.com</a>.
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
            <Link href="/terms-of-service" className="hover:text-gray-600">Terms & Conditions</Link>
            <span className="mx-2">•</span>
            <Link href="/refund-policy" className="hover:text-gray-600">Refund Policy</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
