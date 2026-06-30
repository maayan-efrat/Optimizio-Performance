"use client";

import { motion } from 'framer-motion';
import { XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/contexts/locale';

export default function PaymentCancelPage() {
  const { locale } = useLocale();
  const isRtl = locale === 'he';

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
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/15 border border-red-500/30">
            <XCircle className="h-12 w-12 text-red-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[#F9FAFB] mb-3">
          {isRtl ? 'התשלום בוטל' : 'Payment Cancelled'}
        </h1>
        <p className="text-[#A1A1AA] mb-8">
          {isRtl
            ? 'לא חויבת. תוכלי לנסות שוב בכל עת.'
            : "You were not charged. You can try again at any time."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-6 py-3 font-semibold text-white hover:from-violet-600 hover:to-blue-600 transition-all"
          >
            {isRtl ? 'חזרה לתמחור' : 'Back to Pricing'}
            <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-[#F9FAFB] hover:bg-white/10 transition-all"
          >
            {isRtl ? 'לדשבורד' : 'Dashboard'}
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
