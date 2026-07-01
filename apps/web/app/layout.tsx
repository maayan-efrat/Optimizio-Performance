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
  alternates: {
    canonical: '/',
    languages: {
      'he':        SITE_URL,
      'en':        SITE_URL,
      'x-default': SITE_URL,
    },
  },
  manifest: '/manifest.json',
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
    description: '150 קרדיטים חינם בהצטרפות — סריקה ראשונה חינם',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Heebo:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Skip navigation — first focusable element for keyboard/screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:start-4 focus:rounded-xl focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none"
        >
          דילוג לתוכן הראשי
        </a>
        <LocaleProvider>
          <AuthProvider>
            <Navigation />
            {children}
          </AuthProvider>
        </LocaleProvider>
        {/* JSON-LD — type="application/ld+json" is a data block, not JS, so no nonce needed */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
