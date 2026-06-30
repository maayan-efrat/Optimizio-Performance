import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/layout/navigation';
import { AuthProvider } from '@/contexts/auth';
import { LocaleProvider } from '@/contexts/locale';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://optimizio.co.il';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Optimizio Performance — ניתוח ביצועי אתרים AI',
    template: '%s | Optimizio Performance',
  },
  description: 'כלי AI לניתוח ביצועי אתרים, SEO, אבטחה ונגישות. קבלו דוח מפורט ותוכנית שיפור תוך 30 שניות.',
  keywords: ['ביצועי אתרים', 'SEO', 'אבטחת אתרים', 'נגישות', 'web performance', 'website audit', 'אופטימיזציה'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    alternateLocale: 'en_US',
    siteName: 'Optimizio Performance',
    title: 'Optimizio Performance — ניתוח ביצועי אתרים AI',
    description: 'כלי AI לניתוח ביצועי אתרים, SEO, אבטחה ונגישות. קבלו דוח מפורט תוך 30 שניות.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Optimizio Performance — ניתוח ביצועי אתרים AI',
    description: 'כלי AI לניתוח ביצועי אתרים, SEO, אבטחה ונגישות.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1 },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Optimizio Performance',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'כלי AI לניתוח ביצועי אתרים, SEO, אבטחה ונגישות עבור עסקים ישראליים',
  url: SITE_URL,
  inLanguage: ['he', 'en'],
  offers: {
    '@type': 'Offer',
    priceCurrency: 'ILS',
    price: '0',
    description: '300 קרדיטים חינם בהצטרפות — 3 סריקות ראשונות חינם',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
