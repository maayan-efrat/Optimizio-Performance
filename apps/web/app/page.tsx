"use client";

import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Compass, ShieldCheck, Sparkles, Zap, Search, Globe, Lock, Eye, Smartphone, Link2, Code2, FileCode2, ActivitySquare } from 'lucide-react';
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
    <main id="main-content" className="min-h-screen bg-transparent text-[#f0f4ff]" dir={isRtl ? 'rtl' : 'ltr'}>
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

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 pb-16 sm:px-8 lg:px-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-violet-400">
            {isRtl ? 'תהליך' : 'Process'}
          </p>
          <h2 className="text-3xl font-bold text-[#f0f4ff] sm:text-4xl">{dict.howItWorks.heading}</h2>
          <p className="mt-4 text-lg leading-8 text-[#9b9dc9]">{dict.howItWorks.subheading}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {dict.howItWorks.steps.map((step) => (
            <div key={step.number} className="relative rounded-2xl border border-violet-500/15 bg-[#1e1b4b]/40 p-6">
              <span className="mb-4 block text-4xl font-black text-violet-500/30">{step.number}</span>
              <h3 className="mb-2 font-semibold text-[#f0f4ff]">{step.title}</h3>
              <p className="text-sm leading-6 text-[#9b9dc9]">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why performance matters */}
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12">
        <div className="rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-[#0d1b2a] to-[#111827] p-8 sm:p-10">
          <h2 className="mb-8 text-2xl font-bold text-[#f0f4ff] sm:text-3xl">{dict.whySection.heading}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {dict.whySection.items.map((item) => (
              <div key={item.stat} className="space-y-2">
                <p className="text-4xl font-black text-cyan-400">{item.stat}</p>
                <p className="text-sm leading-6 text-[#9b9dc9]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scanner categories — what the scanner checks */}
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-400">
            {isRtl ? 'מה הסורק בודק?' : 'What does the scanner check?'}
          </p>
          <h2 className="text-3xl font-bold text-[#f0f4ff] sm:text-4xl">
            {isRtl ? '9 קטגוריות ניתוח מעמיק' : '9 categories of deep analysis'}
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#9b9dc9]">
            {isRtl
              ? 'הסורק שלנו בודק כל היבט חשוב של האתר — מביצועים ו-SEO ועד אבטחה ופרטיות.'
              : 'Our scanner checks every important aspect of your website — from performance and SEO to security and privacy.'}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              {
                Icon: Zap,
                card: 'rounded-2xl border border-violet-500/15 bg-violet-500/5 p-5 hover:border-violet-500/25 transition-colors',
                icon: 'flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15',
                iconColor: 'h-4 w-4 text-violet-400',
                badge: 'text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full',
                titleHe: 'ביצועים', titleEn: 'Performance',
                descHe: 'מהירות טעינה, TTFB, Core Web Vitals, דחיסה, מטמון, תמונות, סקריפטים חוסמי רינדור.',
                descEn: 'Page load speed, TTFB, Core Web Vitals, compression, caching, image optimization, render-blocking scripts.',
                countHe: '20+ בדיקות', countEn: '20+ checks',
              },
              {
                Icon: Search,
                card: 'rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-5 hover:border-cyan-500/25 transition-colors',
                icon: 'flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15',
                iconColor: 'h-4 w-4 text-cyan-400',
                badge: 'text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full',
                titleHe: 'SEO', titleEn: 'SEO',
                descHe: 'Title, meta, H1-H6, canonical, Open Graph, hreflang, sitemap, robots, מבנה URL, תוכן דק.',
                descEn: 'Title, meta description, H1-H6, canonical, Open Graph, hreflang, sitemap, robots.txt, URL structure, thin content.',
                countHe: '25+ בדיקות', countEn: '25+ checks',
              },
              {
                Icon: Lock,
                card: 'rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5 hover:border-emerald-500/25 transition-colors',
                icon: 'flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15',
                iconColor: 'h-4 w-4 text-emerald-400',
                badge: 'text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full',
                titleHe: 'אבטחה', titleEn: 'Security',
                descHe: 'HTTPS, HSTS, CSP, CORS, SRI, headers, cookies, קבצים חשופים, iframe sandbox.',
                descEn: 'HTTPS, HSTS, CSP, CORS, SRI, security headers, cookie flags, exposed sensitive files, iframe sandbox.',
                countHe: '18+ בדיקות', countEn: '18+ checks',
              },
              {
                Icon: Eye,
                card: 'rounded-2xl border border-sky-500/15 bg-sky-500/5 p-5 hover:border-sky-500/25 transition-colors',
                icon: 'flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15',
                iconColor: 'h-4 w-4 text-sky-400',
                badge: 'text-[10px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full',
                titleHe: 'נגישות', titleEn: 'Accessibility',
                descHe: 'alt text, lang, aria-label, כפתורים ללא שם, tabindex, IDs כפולים, iframe title, היררכיית כותרות.',
                descEn: 'Alt text, lang attr, aria-label, unlabeled inputs, tabindex, duplicate IDs, iframe titles, heading hierarchy.',
                countHe: '12+ בדיקות', countEn: '12+ checks',
              },
              {
                Icon: Smartphone,
                card: 'rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-5 hover:border-fuchsia-500/25 transition-colors',
                icon: 'flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/15',
                iconColor: 'h-4 w-4 text-fuchsia-400',
                badge: 'text-[10px] font-semibold text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-0.5 rounded-full',
                titleHe: 'מובייל', titleEn: 'Mobile',
                descHe: 'viewport, touch targets, apple-touch-icon, theme-color, manifest, viewport-fit.',
                descEn: 'Viewport meta, touch target sizes, apple-touch-icon, theme-color, web manifest, viewport-fit.',
                countHe: '8+ בדיקות', countEn: '8+ checks',
              },
              {
                Icon: ActivitySquare,
                card: 'rounded-2xl border border-rose-500/15 bg-rose-500/5 p-5 hover:border-rose-500/25 transition-colors',
                icon: 'flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15',
                iconColor: 'h-4 w-4 text-rose-400',
                badge: 'text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full',
                titleHe: 'פרטיות', titleEn: 'Privacy',
                descHe: 'טרקרים (Google, Facebook, TikTok), banner הסכמה, מדיניות פרטיות, YouTube, Google Fonts, Facebook SDK.',
                descEn: 'Trackers (Google, Facebook, TikTok), consent banner, privacy policy, YouTube privacy mode, Google Fonts, Facebook SDK.',
                countHe: '8+ בדיקות', countEn: '8+ checks',
              },
              {
                Icon: Link2,
                card: 'rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5 hover:border-amber-500/25 transition-colors',
                icon: 'flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15',
                iconColor: 'h-4 w-4 text-amber-400',
                badge: 'text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full',
                titleHe: 'קישורים', titleEn: 'Links',
                descHe: 'קישורים שבורים, הפניות, target=_blank ללא noopener, עמוד 404 מותאם, עוגני קישור.',
                descEn: 'Broken links, redirect chains, target=_blank without noopener, custom 404 page, anchor text quality.',
                countHe: '6+ בדיקות', countEn: '6+ checks',
              },
              {
                Icon: Code2,
                card: 'rounded-2xl border border-indigo-500/15 bg-indigo-500/5 p-5 hover:border-indigo-500/25 transition-colors',
                icon: 'flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15',
                iconColor: 'h-4 w-4 text-indigo-400',
                badge: 'text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full',
                titleHe: 'JavaScript / CSS', titleEn: 'JavaScript / CSS',
                descHe: 'קבצים גדולים, ספריות כבדות (Moment.js, jQuery+React), Bootstrap ישן, React dev build.',
                descEn: 'Large files, heavy libraries (Moment.js, jQuery+React), outdated Bootstrap, React dev build in production.',
                countHe: '10+ בדיקות', countEn: '10+ checks',
              },
              {
                Icon: FileCode2,
                card: 'rounded-2xl border border-teal-500/15 bg-teal-500/5 p-5 hover:border-teal-500/25 transition-colors',
                icon: 'flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15',
                iconColor: 'h-4 w-4 text-teal-400',
                badge: 'text-[10px] font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full',
                titleHe: 'Schema / נתונים מובנים', titleEn: 'Schema / Structured Data',
                descHe: 'JSON-LD, LocalBusiness, Article, Product, BreadcrumbList — Rich Results בגוגל.',
                descEn: 'JSON-LD schema validation, LocalBusiness, Article, Product, BreadcrumbList — enabling Google Rich Results.',
                countHe: '4+ בדיקות', countEn: '4+ checks',
              },
            ] as const
          ).map(({ Icon, card, icon, iconColor, badge, titleHe, titleEn, descHe, descEn, countHe, countEn }) => (
            <div key={titleEn} className={card}>
              <div className="mb-3 flex items-center justify-between">
                <div className={icon}>
                  <Icon className={iconColor} />
                </div>
                <span className={badge}>
                  {isRtl ? countHe : countEn}
                </span>
              </div>
              <h3 className="mb-1.5 font-semibold text-[#f0f4ff]">{isRtl ? titleHe : titleEn}</h3>
              <p className="text-xs text-[#9b9dc9] leading-5">{isRtl ? descHe : descEn}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition shadow-lg shadow-violet-500/30"
          >
            <Zap className="h-4 w-4" />
            {isRtl ? 'סרקו את האתר שלכם עכשיו — בחינם' : 'Scan your website now — free'}
          </Link>
        </div>
      </section>

      <footer className="border-t border-violet-500/15 px-6 py-8 text-sm text-[#9b9dc9] sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p>{dict.footerText}</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#F9FAFB] transition-colors">
              {isRtl ? 'מדיניות פרטיות' : 'Privacy Policy'}
            </Link>
            <p>© 2026 Optimizio Performance</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
