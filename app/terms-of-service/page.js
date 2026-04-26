import Link from 'next/link';
import { MainNavbar } from '@/components/MainNavbar';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions | Unishaala',
  description: 'Read the terms and conditions for using Unishaala\'s exam preparation platform.',
};

export default function TermsOfServicePage() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
            <p className="text-sm text-gray-500">Effective Date: 1 March 2026</p>
          </header>

          {/* Content */}
          <article className="max-w-none">
            
            {/* Terms of Service */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Terms of Service</h2>
              <p className="text-gray-600 mb-4 text-justify">
                Welcome to Unishaala. These Terms of Service ("Terms") govern your access to and use of the website unishaala.com and any related services, content, features, or applications (collectively, the "Platform"). By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, you should not use the Platform.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala provides an online learning environment that enables users to access educational content, courses, and related services. The Platform is intended for personal and non-commercial use unless otherwise expressly permitted. By using the Platform, you confirm that you are legally capable of entering into a binding agreement under applicable law.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                To access certain features, you may be required to create an account. You agree to provide accurate, current, and complete information during registration and to maintain the confidentiality of your login credentials. You are solely responsible for all activities that occur under your account. Unishaala reserves the right to suspend or terminate accounts that provide false information or violate these Terms.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                All content available on the Platform, including but not limited to videos, lectures, text, graphics, logos, and course materials, is either owned by Unishaala or licensed to it and is protected under applicable intellectual property laws. Users are granted a limited, non-exclusive, non-transferable license to access and use the content strictly for personal educational purposes. Any unauthorized reproduction, distribution, modification, or public display of the content is strictly prohibited.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Where the Platform offers paid courses or services, users agree to pay all applicable fees. Pricing, payment methods, and refund policies may vary depending on the course or offering and are subject to change at Unishaala's discretion. Any refunds, if applicable, will be processed in accordance with the specific terms associated with the purchase.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Users may have the ability to submit or upload content, including comments, feedback, or other materials. By submitting such content, you grant Unishaala a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display that content in connection with the operation of the Platform. You represent and warrant that your content does not violate any laws or infringe upon the rights of any third party.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala strives to provide uninterrupted and accurate services but does not guarantee that the Platform will always be available, error-free, or secure. To the fullest extent permitted by law, Unishaala shall not be liable for any indirect, incidental, consequential, or punitive damages, including loss of data, revenue, or profits arising from your use of the Platform.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala reserves the right to modify or discontinue any aspect of the Platform at any time without prior notice. We may also update these Terms periodically. Continued use of the Platform after such changes constitutes your acceptance of the revised Terms.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts located in Jaipur.
              </p>
              <p className="text-gray-600 text-justify">
                If you have any questions regarding these Terms, you may contact us at <a href="mailto:admin@unishaala.com" className="text-brand-600 hover:underline">admin@unishaala.com</a>
              </p>
            </section>

            {/* Instructor Terms */}
            <section className="mb-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Instructor Terms</h2>
              <p className="text-sm text-gray-500 mb-4">Effective Date: 1 March, 2026</p>
              <p className="text-gray-600 mb-4 text-justify">
                These Instructor Terms govern the participation of educators, instructors, and content creators ("Instructors") who contribute educational content to Unishaala through unishaala.com. By registering as an Instructor, you agree to provide accurate and complete information about yourself and your qualifications. You are responsible for ensuring that the content you upload is original, lawful, and does not infringe upon any third-party rights, including intellectual property or privacy rights.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Instructors retain ownership of the content they create; however, by publishing content on the Platform, you grant Unishaala a worldwide, non-exclusive, royalty-free license to host, display, distribute, promote, and make such content available to users. This license continues for as long as the content remains on the Platform.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Instructors are responsible for maintaining the quality, accuracy, and relevance of their courses. Unishaala reserves the right to review, modify, or remove content that does not meet platform standards or violates applicable policies or laws.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Where courses are monetized, revenue sharing arrangements will be governed by separate agreements or policies communicated to Instructors. Payments will be subject to applicable deductions, taxes, and payment processing requirements.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Instructors must not engage in activities that attempt to bypass the Platform's systems, including redirecting users for off-platform payments or sharing unauthorized links. Any such activity may result in suspension or termination of Instructor accounts.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala reserves the right to suspend or terminate Instructor access in cases of policy violations, misconduct, or failure to maintain content standards. Upon termination, Unishaala may retain or remove content at its discretion.
              </p>
              <p className="text-gray-600 text-justify">
                For any queries regarding Instructor participation, please contact <a href="mailto:admin@unishaala.com" className="text-brand-600 hover:underline">admin@unishaala.com</a>.
              </p>
            </section>

            {/* Community Guidelines */}
            <section className="mb-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Community Guidelines</h2>
              <p className="text-sm text-gray-500 mb-4">Effective Date: 1 March, 2026</p>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala is committed to creating a respectful, safe, and productive learning environment for all users. These Community Guidelines outline the standards of behavior expected from anyone who uses the Platform.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Users are expected to engage respectfully with instructors and fellow learners. Harassment, hate speech, abusive language, threats, or any form of discrimination based on race, religion, gender, nationality, or other protected characteristics will not be tolerated.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                All interactions, including comments, discussions, and messages, should remain constructive and relevant to learning. Spamming, self-promotion, or posting misleading or irrelevant content is prohibited.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Users must not upload, share, or distribute content that is unlawful, harmful, defamatory, obscene, or infringes on the rights of others. This includes unauthorized sharing of copyrighted materials or private information.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Any attempts to disrupt the Platform, including hacking, unauthorized access, or misuse of systems, are strictly prohibited. Users must also respect the integrity of courses and refrain from cheating, plagiarism, or academic dishonesty.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala reserves the right to moderate content and take appropriate action, including removing content or suspending accounts, in cases of violations. Repeated or severe violations may result in permanent termination.
              </p>
              <p className="text-gray-600 text-justify">
                By participating on the Platform, you agree to abide by these guidelines and contribute to a positive learning community.
              </p>
            </section>

            {/* Mobile Application Terms */}
            <section className="mb-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mobile Application Terms</h2>
              <p className="text-sm text-gray-500 mb-4">Effective Date: 1 March, 2026</p>
              <p className="text-gray-600 mb-4 text-justify">
                These Mobile Application Terms apply to users accessing Unishaala through mobile applications on Android, iOS, or other devices. By downloading or using the Unishaala mobile application, you agree to be bound by these Terms in addition to our general Terms of Service.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                The mobile application is licensed, not sold, to you for personal, non-commercial use. You may not modify, distribute, reverse engineer, or create derivative works based on the application. Your use of the application must comply with the terms and policies of the respective app store providers, including Google Play and Apple App Store. Unishaala is not responsible for any issues arising from third-party platforms or services.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                We may release updates, enhancements, or new features for the application from time to time. Continued use of the app after such updates constitutes your acceptance of any changes.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                Unishaala does not guarantee uninterrupted or error-free operation of the mobile application and shall not be liable for any losses arising from its use.
              </p>
              <p className="text-gray-600 mb-4 text-justify">
                If you uninstall the application, your rights under these Terms will terminate, although certain provisions may continue to apply.
              </p>
              <p className="text-gray-600 text-justify">
                For any mobile-related support or inquiries, please contact <a href="mailto:admin@unishaala.com" className="text-brand-600 hover:underline">admin@unishaala.com</a>
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
