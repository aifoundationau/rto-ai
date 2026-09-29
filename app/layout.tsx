import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduPulse AI - University Student Admissions Agent & Calendar Portal',
  description: 'Web-based AI agent bot for university FAQs, course descriptions, individual unit syllabuses, student application form filling, and Google Calendar event registrations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
