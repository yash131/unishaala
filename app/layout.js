import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
  title: 'Unishaala - Your Gateway to Success',
  description: 'Prepare for GATE, CAT, UPSC, JEE and more with mock tests, question banks, and previous year papers.',
  keywords: 'GATE, CAT, UPSC, JEE, mock tests, question bank, previous papers, exam preparation',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
