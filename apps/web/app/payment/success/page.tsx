"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLocale } from '@/contexts/locale';
import { useAuth } from '@/contexts/auth';

export default function PaymentSuccessPage() {
  const { locale } = useLocale();
  const isRtl = locale === 'he';
  const { refreshCredits } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    // Give Cardcom webhook a moment to process, then refresh
    const timer = setTimeout(async () => {
      try {
        await refreshCredits();
        const { credits } = await api.payments.getCredits();
        setCredits(credits);
      } catch {
        // ignore
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [refreshCredits]);

  return (
    <main className="min-h-screen bg-transparent flex items-center justify-center px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center max-w-md w-full"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[#F9FAFB] mb-3">
          {isRtl ? '🎉 התשלום הצליח!' : '🎉 Payment Successful!'}
        </h1>
        <p className="text-[#A1A1AA] mb-2">
          {isRtl
            ? 'הקרדיטים נוספו לחשבון שלך ומוכנים לשימוש.'
            : 'Your credits have been added and are ready to use.'}
        </p>

        {credits !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 mb-8 inline-flex items-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-6 py-3"
          >
            <Sparkles className="h-5 w-5 text-violet-400" />
            <span className="text-violet-300 font-semibold">
              {credits.toLocaleString()} {isRtl ? 'קרדיטים זמינים' : 'credits available'}
            </span>
          </motion.div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-6 py-3 font-semibold text-white hover:from-violet-600 hover:to-blue-600 transition-all"
          >
            {isRtl ? 'לדשבורד' : 'Go to Dashboard'}
            <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>
          <Link
            href="/scan"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-[#F9FAFB] hover:bg-white/10 transition-all"
          >
            {isRtl ? 'התחלי סריקה' : 'Start a Scan'}
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
