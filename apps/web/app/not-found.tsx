"use client";

import Link from 'next/link';
import { Home, Search, Zap } from 'lucide-react';
import { useLocale } from '@/contexts/locale';

export default function NotFound() {
  const { locale } = useLocale();
  const isRtl = locale === 'he';

  return (
    <main
      id="main-content"
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex min-h-screen items-center justify-center bg-transparent px-6 text-[#F9FAFB]"
    >
      <div className="text-center max-w-md animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/20 border border-violet-500/20">
          <Zap className="h-8 w-8 text-violet-400" />
        </div>

        <p className="text-7xl font-black text-violet-400 mb-2">404</p>
        <h1 className="text-xl font-bold text-[#F9FAFB] mb-3">
          {isRtl ? 'הדף לא נמצא' : 'Page not found'}
        </h1>
        <p className="text-sm leading-6 text-[#A1A1AA] mb-8">
          {isRtl
            ? 'הדף שחיפשת אינו קיים. ייתכן שהקישור שגוי, או שהדף הוסר.'
            : "The page you're looking for doesn't exist. The link may be broken or the page may have been removed."}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition shadow-lg shadow-violet-500/25"
          >
            <Home className="h-4 w-4" />
            {isRtl ? 'חזרה לדף הבית' : 'Back to home'}
          </Link>
          <Link
            href="/scan"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#F9FAFB] hover:bg-white/10 transition"
          >
            <Search className="h-4 w-4" />
            {isRtl ? 'סרקו אתר' : 'Scan a website'}
          </Link>
        </div>

        <div className="mt-10">
          <p className="mb-3 text-xs text-[#A1A1AA]">
            {isRtl ? 'עמודים פופולריים:' : 'Popular pages:'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(
              [
                { href: '/features', labelHe: 'תכונות',      labelEn: 'Features' },
                { href: '/pricing',  labelHe: 'מחירים',       labelEn: 'Pricing'  },
                { href: '/faq',      labelHe: 'שאלות נפוצות', labelEn: 'FAQ'      },
                { href: '/login',    labelHe: 'כניסה',        labelEn: 'Sign in'  },
              ] as const
            ).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#A1A1AA] hover:text-[#F9FAFB] hover:bg-white/10 transition"
              >
                {isRtl ? item.labelHe : item.labelEn}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
