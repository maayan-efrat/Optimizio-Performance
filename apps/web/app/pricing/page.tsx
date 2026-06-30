"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Sparkles, Star, Gift, Loader2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/locale';
import { getDictionary } from '@/lib/i18n';
import { api } from '@/lib/api';

const PACK_ICONS = [Zap, Sparkles, Star];

export default function PricingPage() {
  const { locale } = useLocale();
  const t = getDictionary(locale).pricing;
  const isRtl = locale === 'he';
  const router = useRouter();
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean | null>(null);

  // Check if payments are enabled (only if user is logged in)
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setPaymentsEnabled(false); return; }
    api.payments.getCredits()
      .then(({ paymentsEnabled }) => setPaymentsEnabled(paymentsEnabled))
      .catch(() => setPaymentsEnabled(false));
  }, []);

  async function handleBuy(packageId: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { router.push('/register'); return; }
    if (!paymentsEnabled) return;
    setLoadingPkg(packageId);
    setError(null);
    try {
      const { url } = await api.payments.createCheckout(packageId);
      window.location.href = url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה, נסי שוב');
      setLoadingPkg(null);
    }
  }

  const disabled = !paymentsEnabled;

  return (
    <main className="min-h-screen bg-transparent text-[#F9FAFB]" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg text-[#A1A1AA] max-w-xl mx-auto">{t.subtitle}</p>
        </motion.div>

        {/* Free bonus banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mx-auto max-w-xl mb-8">
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4">
            <Gift className="h-6 w-6 text-emerald-400 shrink-0" />
            <p className="text-sm font-medium text-emerald-300">{t.freeBonus}</p>
          </div>
        </motion.div>

        {/* Payments disabled banner */}
        {paymentsEnabled === false && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mx-auto max-w-xl mb-10">
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-4">
              <Lock className="h-5 w-5 text-amber-400 shrink-0" />
              <p className="text-sm font-medium text-amber-300">
                {isRtl
                  ? 'מערכת התשלומים אינה זמינה כרגע. קרדיטים יינתנו בקרוב!'
                  : 'Payments are temporarily unavailable. Credits coming soon!'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mx-auto max-w-xl mb-8 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Credit packages */}
        <div className="grid gap-6 md:grid-cols-3">
          {t.packages.map((pkg, i) => {
            const Icon = PACK_ICONS[i];
            const isLoading = loadingPkg === pkg.packageId;
            return (
              <motion.div
                key={pkg.packageId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className={`relative ${disabled ? 'opacity-70' : ''}`}
              >
                {pkg.highlight && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="rounded-full bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                      ✨ {t.popular}
                    </span>
                  </div>
                )}

                <div className={`h-full rounded-2xl border p-8 flex flex-col ${
                  pkg.highlight
                    ? 'border-violet-500/60 bg-gradient-to-br from-violet-950/40 to-blue-950/40 shadow-[0_0_40px_rgba(139,92,246,0.15)]'
                    : 'border-white/10 bg-[#111827]/80'
                }`}>
                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      pkg.highlight ? 'bg-violet-500/20' : 'bg-white/5'
                    }`}>
                      <Icon className={`h-5 w-5 ${pkg.highlight ? 'text-violet-400' : 'text-[#A1A1AA]'}`} />
                    </div>
                    <h3 className="text-lg font-bold text-[#F9FAFB]">{pkg.name}</h3>
                  </div>

                  {/* Credits count */}
                  <div className="mb-2">
                    <span className={`text-5xl font-extrabold ${pkg.highlight ? 'text-violet-300' : 'text-[#F9FAFB]'}`}>
                      {pkg.credits.toLocaleString()}
                    </span>
                    <span className="ms-2 text-[#A1A1AA] text-lg">{t.creditsLabel}</span>
                  </div>

                  {/* Scans equivalent */}
                  <p className="text-sm text-[#A1A1AA] mb-1">{pkg.scans}</p>
                  <p className="text-xs text-[#64748B] mb-6">{t.perScan}</p>

                  {/* Price */}
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-3xl font-bold ${pkg.highlight ? 'text-violet-300' : 'text-[#F9FAFB]'}`}>
                        {pkg.price}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mb-6">{pkg.priceNote}</p>

                    <button
                      onClick={() => handleBuy(pkg.packageId)}
                      disabled={disabled || loadingPkg !== null}
                      className={`block w-full text-center rounded-xl py-3 font-semibold text-sm transition-all disabled:cursor-not-allowed ${
                        disabled
                          ? 'border border-white/10 bg-white/5 text-[#64748B]'
                          : pkg.highlight
                            ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:from-violet-600 hover:to-blue-600 shadow-lg'
                            : 'border border-white/15 bg-white/5 text-[#F9FAFB] hover:bg-white/10'
                      }`}
                    >
                      {isLoading
                        ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {isRtl ? 'מעבירה לתשלום...' : 'Redirecting...'}</span>
                        : disabled
                          ? <span className="flex items-center justify-center gap-2"><Lock className="h-4 w-4" /> {isRtl ? 'בקרוב' : 'Coming soon'}</span>
                          : pkg.cta
                      }
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-12 text-center text-sm text-[#64748B]">
          {isRtl
            ? 'קרדיטים לא פגים לעולם. ניתן לרכוש חבילות נוספות בכל עת.'
            : 'Credits never expire. You can purchase additional packs at any time.'}
        </motion.p>
      </section>
    </main>
  );
}
