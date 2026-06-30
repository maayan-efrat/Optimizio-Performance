"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowRight, Activity, AlertTriangle, Sparkles, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { useAuth } from '@/contexts/auth';
import { useLocale } from '@/contexts/locale';
import { getDictionary } from '@/lib/i18n';
import { api, type Project, type Scan, type RoadmapItem } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const t = getDictionary(locale).dashboard;
  const isRtl = locale === 'he';

  const [projects, setProjects] = useState<Project[]>([]);
  const [latestScan, setLatestScan] = useState<Scan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await api.projects.list();
        setProjects(list);
        if (list.length > 0) {
          const scans = await api.scans.listByProject(list[0].id);
          if (scans.length > 0) setLatestScan(scans[0]);
        }
      } catch {
        // show empty state
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const roadmap = (latestScan?.priorityRoadmap as RoadmapItem[] | null) ?? [];

  return (
    <ProtectedLayout>
      <main className="min-h-screen bg-transparent px-6 py-8 text-[#F9FAFB] sm:px-8 lg:px-12" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mx-auto flex max-w-7xl flex-col gap-8">

          {/* Header */}
          <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827] to-[#18181B] p-8 shadow-glow">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#06B6D4]">{t.commandCenter}</p>
                <h1 className="text-3xl font-semibold sm:text-4xl">
                  {(() => {
                    const firstName = user?.name?.trim().split(' ')[0];
                    return firstName
                      ? `${t.welcomeBack}, ${firstName}.`
                      : t.welcomeBack + '.';
                  })()}
                </h1>
              </div>
              <Link href="/scan"><Button>{t.newScan} <ArrowRight className="ms-2 h-4 w-4" /></Button></Link>
            </div>
            {projects.length > 0 && (
              <p className="max-w-3xl text-lg leading-8 text-[#A1A1AA]">
                {t.monitoring} <span className="text-[#F9FAFB]">{projects[0].domain}</span>
                {projects.length > 1 && ` ${t.and} ${projects.length - 1} ${projects.length === 2 ? t.moreProject : t.moreProjects}`}.
              </p>
            )}
          </motion.header>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#A1A1AA]" />
            </div>
          ) : !latestScan ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-6 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827] to-[#18181B] p-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#EC4899]/20 via-[#8B5CF6]/20 to-[#3B82F6]/20">
                <Plus className="h-8 w-8 text-[#F9FAFB]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#F9FAFB]">{t.emptyTitle}</h2>
                <p className="mt-2 text-sm text-[#A1A1AA]">{t.emptyDesc}</p>
              </div>
              <Link href="/scan"><Button>{t.firstScan} <ArrowRight className="ms-2 h-4 w-4" /></Button></Link>
            </motion.div>
          ) : (
            <>
              <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <Card className="bg-[#111827]/90">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{t.latestScan}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className="border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]">{t.healthy}</Badge>
                        <Link href={`/report/${latestScan.id}` as any}
                          className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 rounded-lg px-2 py-1">
                          {locale === 'he' ? 'דוח מלא ←' : 'Full report →'}
                        </Link>
                      </div>
                    </div>
                    <CardDescription>{latestScan.url} — {new Date(latestScan.createdAt).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-4">
                      {[
                        { label: t.scores.overall, value: latestScan.overallScore, accent: 'text-[#F9FAFB]' },
                        { label: t.scores.performance, value: latestScan.performanceScore, accent: 'text-[#EC4899]' },
                        { label: t.scores.accessibility, value: latestScan.accessibilityScore, accent: 'text-[#06B6D4]' },
                        { label: t.scores.seo, value: latestScan.seoScore, accent: 'text-[#22C55E]' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm text-[#A1A1AA]">{s.label}</p>
                          <p className={`mt-2 text-3xl font-semibold ${s.accent}`}>{s.value ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#111827]/90">
                  <CardHeader>
                    <CardTitle>{t.aiInsight}</CardTitle>
                    <CardDescription>{t.aiInsightDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-2xl border border-[#EC4899]/20 bg-[#EC4899]/10 p-4 text-sm leading-7 text-[#F9FAFB]">
                      <div className="mb-3 flex items-center gap-2 font-semibold">
                        <Sparkles className="h-4 w-4" /> {t.recommendationSummary}
                      </div>
                      {latestScan.aiSummary ?? t.noSummary}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {roadmap.length > 0 && (
                <section className="grid gap-6 lg:grid-cols-2">
                  <Card className="bg-[#111827]/90">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-[#F59E0B]" /> {t.roadmap}
                      </CardTitle>
                      <CardDescription>{t.roadmapDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {roadmap.slice(0, 3).map((item) => (
                          <div key={item.rank} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="font-semibold text-[#F9FAFB]">#{item.rank} {item.issue}</p>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.impact === 'HIGH' ? 'bg-red-500/20 text-red-400' : item.impact === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>{item.impact}</span>
                                <span className="text-xs text-[#22C55E]">{item.expectedImprovement}</span>
                              </div>
                            </div>
                            {item.description && <p className="text-sm text-[#A1A1AA] leading-6">{item.description}</p>}
                            {item.howToFix && (
                              <div className="rounded-xl border border-white/10 bg-[#09090B]/60 p-3">
                                <p className="text-xs font-medium text-[#06B6D4] mb-1">{isRtl ? 'איך לתקן:' : 'How to fix:'}</p>
                                <p className="text-xs text-[#A1A1AA] leading-5 whitespace-pre-line">{item.howToFix}</p>
                              </div>
                            )}
                            {item.codeExample && (
                              <pre className="rounded-xl border border-white/10 bg-[#09090B] p-3 text-xs text-[#22C55E] overflow-x-auto whitespace-pre-wrap">{item.codeExample}</pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#111827]/90">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-[#06B6D4]" /> {t.history}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {projects.map((p) => (
                          <div key={p.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                            <span className="text-[#F9FAFB]">{p.name}</span>
                            <span className="text-[#A1A1AA]">{p.domain}</span>
                            <Link href="/scan" className="text-[#EC4899] hover:underline text-xs">{t.scanAgain}</Link>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </ProtectedLayout>
  );
}
