"use client";

import { motion } from 'framer-motion';
import { CheckCircle2, LoaderCircle, Radar, ShieldCheck, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { useLocale } from '@/contexts/locale';
import { getDictionary } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth';

function parseDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

export default function ScanPage() {
  const router = useRouter();
  const { refreshCredits } = useAuth();
  const { locale } = useLocale();
  const t = getDictionary(locale).scan;
  const isRtl = locale === 'he';

  const [url, setUrl] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [pollScanId, setPollScanId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = useMemo(() => ((activeStep + 1) / t.steps.length) * 100, [activeStep, t.steps.length]);

  // Poll scan progress when we have a scanId
  useEffect(() => {
    if (!pollScanId) return;
    pollRef.current = setInterval(async () => {
      try {
        const { status, progressPercent } = await api.scans.getProgress(pollScanId);
        // Map backend progressPercent (0-100) to step index
        const stepIdx = Math.min(
          Math.floor((progressPercent / 100) * t.steps.length),
          t.steps.length - 1,
        );
        setActiveStep(stepIdx);
        if (status === 'completed') {
          clearInterval(pollRef.current!);
          clearInterval(intervalRef.current!);
          setActiveStep(t.steps.length - 1);
          refreshCredits();
          setTimeout(() => router.push(`/report/${pollScanId}`), 800);
        } else if (status === 'failed') {
          clearInterval(pollRef.current!);
          clearInterval(intervalRef.current!);
          setIsScanning(false);
          setActiveStep(0);
          setError(isRtl ? 'הסריקה נכשלה. נסי שנית.' : 'Scan failed. Please try again.');
          setPollScanId(null);
        }
      } catch {
        // ignore transient errors
      }
    }, 2000);
    return () => clearInterval(pollRef.current!);
  }, [pollScanId, t.steps.length, router, isRtl]);

  // Fake step animation while waiting for real data
  useEffect(() => {
    if (!isScanning || pollScanId) return;
    intervalRef.current = setInterval(() => {
      setActiveStep(cur => {
        if (cur >= t.steps.length - 2) { clearInterval(intervalRef.current!); return cur; }
        return cur + 1;
      });
    }, 900);
    return () => clearInterval(intervalRef.current!);
  }, [isScanning, pollScanId, t.steps.length]);

  async function startScan() {
    if (!url.trim()) return;
    setError('');
    setIsScanning(true);
    setActiveStep(0);
    setPollScanId(null);

    try {
      const domain = parseDomain(url);
      // Reuse existing project for this domain instead of creating duplicates
      const existing = await api.projects.list();
      const match = existing.find(p => parseDomain(p.domain) === domain || p.domain === url);
      const project = match ?? await api.projects.create({ name: domain, domain: url });
      const scan = await api.scans.create({ projectId: project.id, url, locale });
      setPollScanId(scan.id); // start polling
    } catch (err) {
      clearInterval(intervalRef.current!);
      setIsScanning(false);
      setActiveStep(0);
      setError(err instanceof Error ? err.message : (isRtl ? 'סריקה נכשלה. נסי שנית.' : 'Scan failed. Please try again.'));
    }
  }

  return (
    <ProtectedLayout>
      <main className="min-h-screen bg-transparent px-6 py-8 text-[#F9FAFB] sm:px-8 lg:px-12" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mx-auto flex max-w-6xl flex-col gap-8">

          <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827] to-[#18181B] p-8 shadow-glow">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.3em] text-[#06B6D4]">
              <Radar className="h-4 w-4" /> {t.badge}
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold sm:text-4xl">{t.title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#A1A1AA]">{t.subtitle}</p>
          </motion.header>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="bg-[#111827]/90">
              <CardHeader>
                <CardTitle>{t.cardTitle}</CardTitle>
                <CardDescription>{t.cardDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <label htmlFor="website-url" className="mb-2 block text-sm font-medium text-[#F9FAFB]">{t.urlLabel}</label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="website-url"
                      type="url"
                      placeholder={t.urlPlaceholder}
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isScanning}
                      onKeyDown={(e) => e.key === 'Enter' && !isScanning && startScan()}
                      dir="ltr"
                      className="flex-1 rounded-full border border-white/10 bg-[#09090B] px-4 py-3 text-sm outline-none placeholder:text-[#A1A1AA] focus:border-[#EC4899] disabled:opacity-50"
                    />
                    <Button onClick={startScan} disabled={isScanning || !url.trim()} className="shrink-0">
                      {isScanning ? t.analyzing : t.analyze} <ArrowRight className="ms-2 h-4 w-4" />
                    </Button>
                  </div>
                  {error && (
                    <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
                  )}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between text-sm text-[#A1A1AA]">
                    <span>{t.progress}</span>
                    <span>{isScanning || activeStep > 0 ? `${Math.round(progress)}%` : '0%'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#3B82F6] transition-all duration-500"
                      style={{ width: isScanning || activeStep > 0 ? `${progress}%` : '0%' }} />
                  </div>
                  <div className="mt-5 space-y-3">
                    {t.steps.map((step, index) => {
                      const done = index < activeStep || (!isScanning && activeStep === t.steps.length - 1);
                      const current = index === activeStep && isScanning;
                      return (
                        <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#09090B]/70 p-3">
                          {done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22C55E]" />
                            : current ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-[#06B6D4]" />
                            : <div className="h-4 w-4 shrink-0 rounded-full border border-white/20" />}
                          <span className={`text-sm ${done ? 'text-[#F9FAFB]' : 'text-[#A1A1AA]'}`}>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111827]/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#22C55E]" /> {t.whatTitle}
                </CardTitle>
                <CardDescription>{t.whatDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {t.whatItems.map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-[#A1A1AA]">{item}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </ProtectedLayout>
  );
}
