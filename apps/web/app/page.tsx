"use client";

import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Compass, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useMemo } from 'react';
import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';
import { useLocale } from '@/contexts/locale';
import { useAuth } from '@/contexts/auth';

const FEATURE_ICONS = [ShieldCheck, Compass, BarChart3];

export default function HomePage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const dict = useMemo(() => getDictionary(locale), [locale]);
  const isRtl = locale === 'he';

  return (
    <main className="min-h-screen bg-transparent text-[#f0f4ff]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid flex-1 items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
              <Sparkles className="h-4 w-4" /> {dict.tagline}
            </div>

            {/* Welcome back */}
            {user && (
              <p className="mb-4 text-lg text-cyan-400 font-medium">
                {locale === 'he' ? `ברוכה השבה, ${user.name.split(' ')[0]} 👋` : `Welcome back, ${user.name.split(' ')[0]} 👋`}
              </p>
            )}

            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-[#f0f4ff]">
              {dict.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#9b9dc9]">{dict.heroDescription}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition shadow-lg shadow-violet-500/30"
              >
                {dict.primaryCta} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-6 py-3 text-sm font-medium text-[#f0f4ff] hover:bg-violet-500/20 transition"
              >
                {dict.secondaryCta}
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {dict.stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
                  <p className="text-2xl font-bold text-violet-300">{stat.value}</p>
                  <p className="mt-1 text-sm text-[#9b9dc9]">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            <div className="overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-[#1e1b4b] to-[#16133d] shadow-glow">
              <div className="border-b border-violet-500/15 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-[#9b9dc9]">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> {dict.dashboardTitle}
                </div>
                <p className="text-sm leading-7 text-[#9b9dc9]">{dict.dashboardDescription}</p>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-[#9b9dc9]">{isRtl ? 'ציון ביצועים' : 'Performance'}</span>
                    <span className="text-2xl font-bold text-violet-300">87</span>
                  </div>
                  <div className="h-2 rounded-full bg-violet-500/15">
                    <div className="h-2 w-[87%] rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
                  </div>
                </div>
                <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-[#9b9dc9]">SEO</span>
                    <span className="text-2xl font-bold text-cyan-300">94</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-cyan-400">
                    <Zap className="h-4 w-4" />
                    {isRtl ? 'AI: שפרי מהירות טעינה' : 'AI: improve load speed'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 pb-16 sm:px-8 lg:px-12">
        <div className="mb-10 max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan-400">
            {dict.featureHeading}
          </p>
          <h2 className="text-3xl font-bold text-[#f0f4ff] sm:text-4xl">{dict.featureHeading}</h2>
          <p className="mt-4 text-lg leading-8 text-[#9b9dc9]">{dict.featureSubheading}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {dict.features.items.slice(0, 3).map((feature, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-violet-500/15 bg-[#1e1b4b]/60 p-6 hover:border-violet-500/30 transition-colors"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-violet-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-[#f0f4ff]">{feature.title}</h3>
                <p className="text-sm text-[#9b9dc9] leading-6">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-violet-500/15 px-6 py-8 text-sm text-[#9b9dc9] sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p>{dict.footerText}</p>
          <p>© 2026 Optimizio Performance</p>
        </div>
      </footer>
    </main>
  );
}
