"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Radar, CheckCircle2, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { useLocale } from '@/contexts/locale';
import { useAuth } from '@/contexts/auth';
import { api } from '@/lib/api';

function parseDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const SCAN_STEPS_HE = [
  'בודק נגישות האתר...',
  'מנתח ביצועים...',
  'סורק SEO...',
  'בודק אבטחה...',
  'מנתח ניידות...',
  'מסיים ניתוח...',
];
const SCAN_STEPS_EN = [
  'Reaching your website...',
  'Analyzing performance...',
  'Scanning SEO...',
  'Checking security...',
  'Testing mobile...',
  'Wrapping up...',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const { user } = useAuth();
  const isRtl = locale === 'he';

  const [step, setStep] = useState<'url' | 'scanning' | 'done'>('url');
  const [url, setUrl] = useState('');
  const [scanStep, setScanStep] = useState(0);
  const [scanId, setScanId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = isRtl ? SCAN_STEPS_HE : SCAN_STEPS_EN;

  // If user already has projects, skip onboarding
  useEffect(() => {
    if (!user) return;
    api.projects.list().then(projects => {
      if (projects.length > 0) router.replace('/dashboard');
    }).catch(() => {});
  }, [user, router]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      clearInterval(animIntervalRef.current!);
      clearInterval(pollIntervalRef.current!);
    };
  }, []);

  async function handleStart() {
    const finalUrl = normalizeUrl(url);
    if (!finalUrl) return;
    setError('');
    setStep('scanning');
    setScanStep(0);

    // Animate steps forward while waiting for scan
    animIntervalRef.current = setInterval(() => {
      setScanStep(cur => {
        if (cur >= steps.length - 2) { clearInterval(animIntervalRef.current!); return cur; }
        return cur + 1;
      });
    }, 900);

    let createdScanId: string;
    try {
      const domain = parseDomain(finalUrl);
      const project = await api.projects.create({ name: domain, domain: finalUrl });
      const scan = await api.scans.create({ projectId: project.id, url: finalUrl, locale });
      createdScanId = scan.id;
      setScanId(scan.id);
    } catch (err) {
      clearInterval(animIntervalRef.current!);
      setStep('url');
      setError(err instanceof Error ? err.message : (isRtl ? 'שגיאה, נסו שנית' : 'Error, please try again'));
      return;
    }

    // Poll until scan completes
    pollIntervalRef.current = setInterval(async () => {
      try {
        const { status, progressPercent } = await api.scans.getProgress(createdScanId);

        // Map backend progress to step index
        const stepIdx = Math.min(
          Math.floor((progressPercent / 100) * (steps.length - 1)),
          steps.length - 2
        );
        setScanStep(prev => Math.max(prev, stepIdx));

        if (status === 'completed') {
          clearInterval(pollIntervalRef.current!);
          clearInterval(animIntervalRef.current!);
          setScanStep(steps.length - 1);
          setTimeout(() => setStep('done'), 600);
        } else if (status === 'failed') {
          clearInterval(pollIntervalRef.current!);
          clearInterval(animIntervalRef.current!);
          setStep('url');
          setError(isRtl ? 'הסריקה נכשלה. נסו שנית.' : 'Scan failed. Please try again.');
        }
      } catch {
        // ignore transient polling errors
      }
    }, 2500);
  }

  return (
    <ProtectedLayout>
      <main className="min-h-screen flex items-center justify-center px-4 py-12" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-lg">

          {/* Step dots */}
          <div className="flex justify-center gap-2 mb-10">
            {(['url', 'scanning', 'done'] as const).map((s, i) => (
              <div key={s} className={`h-2 rounded-full transition-all duration-300 ${
                step === s ? 'w-8 bg-violet-500' :
                (['url', 'scanning', 'done'].indexOf(step) > i) ? 'w-2 bg-violet-500/50' : 'w-2 bg-white/15'
              }`} />
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── Step 1: Enter URL ── */}
            {step === 'url' && (
              <motion.div key="url"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="rounded-3xl border border-white/10 bg-[#111827]/90 p-10 shadow-glow backdrop-blur-xl"
              >
                <div className="flex justify-center mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30">
                    <Globe className="h-8 w-8 text-violet-400" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-[#F9FAFB] text-center mb-2">
                  {isRtl
                    ? `שלום, ${user?.name?.split(' ')[0] ?? ''}! 🎉`
                    : `Welcome, ${user?.name?.split(' ')[0] ?? ''}! 🎉`}
                </h1>
                <p className="text-[#A1A1AA] text-center text-sm mb-8">
                  {isRtl
                    ? 'בואו נסרוק את האתר שלכם ונגלה מה אפשר לשפר. זה לוקח כ-30 שניות.'
                    : "Let's scan your website and see what can be improved. Takes about 30 seconds."}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                      {isRtl ? 'כתובת האתר שלכם' : 'Your website URL'}
                    </label>
                    <input
                      type="text"
                      placeholder={isRtl ? 'mysite.co.il' : 'mysite.com'}
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && url.trim() && handleStart()}
                      autoFocus
                      className="w-full rounded-xl border border-white/10 bg-[#09090B] px-4 py-3 text-[#F9FAFB] placeholder:text-[#A1A1AA] focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  {error && (
                    <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handleStart}
                    disabled={!url.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 py-3 font-semibold text-white hover:from-violet-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRtl ? 'התחילו סריקה' : 'Start Scan'}
                    <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                  </button>

                  <p className="text-center text-xs text-[#64748B]">
                    {isRtl ? 'הסריקה הראשונה חינמית — 300 קרדיטים ממתינים לכם' : 'First scan is free — 300 credits waiting for you'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Scanning ── */}
            {step === 'scanning' && (
              <motion.div key="scanning"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="rounded-3xl border border-white/10 bg-[#111827]/90 p-10 shadow-glow backdrop-blur-xl text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-2 border-violet-500/40 animate-ping" style={{ animationDelay: '0.3s' }} />
                    <Radar className="relative h-10 w-10 text-violet-400" />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-[#F9FAFB] mb-2">
                  {isRtl ? 'סורק את האתר...' : 'Scanning your website...'}
                </h2>
                <p className="text-[#A1A1AA] text-sm mb-8">
                  {parseDomain(normalizeUrl(url))}
                </p>

                {/* Progress steps */}
                <div className="space-y-3 text-start">
                  {steps.map((s, i) => (
                    <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                      i < scanStep ? 'text-emerald-400' :
                      i === scanStep ? 'text-[#F9FAFB]' : 'text-[#64748B]'
                    }`}>
                      {i < scanStep
                        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        : i === scanStep
                          ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-400" />
                          : <div className="h-4 w-4 shrink-0 rounded-full border border-white/15" />
                      }
                      {s}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Done ── */}
            {step === 'done' && (
              <motion.div key="done"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="rounded-3xl border border-white/10 bg-[#111827]/90 p-10 shadow-glow backdrop-blur-xl text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  </div>
                </div>

                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
                    <Sparkles className="h-4 w-4" />
                    {isRtl ? 'הסריקה הושלמה!' : 'Scan complete!'}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-[#F9FAFB] mb-3">
                  {isRtl ? 'הדוח שלכם מוכן!' : 'Your report is ready!'}
                </h2>
                <p className="text-[#A1A1AA] text-sm mb-8">
                  {isRtl
                    ? 'גילינו כמה נקודות שאפשר לשפר. לחצו לראות את הדוח המלא.'
                    : 'We found some areas to improve. Click to see your full report.'}
                </p>

                <div className="flex flex-col gap-3">
                  {scanId && (
                    <Link
                      href={`/report/${scanId}` as any}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 py-3 font-semibold text-white hover:from-violet-600 hover:to-blue-600 transition-all"
                    >
                      {isRtl ? 'צפו בדוח המלא' : 'View Full Report'}
                      <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 font-semibold text-[#F9FAFB] hover:bg-white/10 transition-all text-sm"
                  >
                    {isRtl ? 'לדשבורד' : 'Go to Dashboard'}
                  </Link>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </ProtectedLayout>
  );
}
