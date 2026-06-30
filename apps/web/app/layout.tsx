import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/layout/navigation';
import { AuthProvider } from '@/contexts/auth';
import { LocaleProvider } from '@/contexts/locale';

export const metadata: Metadata = {
  title: 'Optimizio Performance',
  description: 'AI-powered website performance optimization for modern SaaS teams.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <LocaleProvider>
          <AuthProvider>
            <Navigation />
            {children}
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
