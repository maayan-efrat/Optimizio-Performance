"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowRight, Activity, AlertTriangle, Sparkles, Plus, Loader2, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { useAuth } from '@/contexts/auth';
import { useLocale } from '@/contexts/locale';
import { getDictionary } from '@/lib/i18n';
import { api, type Project, type Scan, type RoadmapItem } from '@/lib/api';

interface ProjectWithScan {
  project: Project;
  latestScan: Scan | null;
}

function ScoreDiff({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  if (diff === 0) return <span className="flex items-center gap-0.5 text-xs text-[#A1A1AA]"><Minus className="h-3 w-3" />0</span>;
  if (diff > 0) return <span className="flex items-center gap-0.5 text-xs text-emerald-400"><TrendingUp className="h-3 w-3" />+{diff}</span>;
  return <span className="flex items-center gap-0.5 text-xs text-red-400"><TrendingDown className="h-3 w-3" />{diff}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const t = getDictionary(locale).dashboard;
  const isRtl = locale === 'he';

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsWithScans, setProjectsWithScans] = useState<ProjectWithScan[]>([]);
  const [latestScan, setLatestScan] = useState<Scan | null>(null);
  const [scanHistory, setScanHistory] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await api.projects.list();
        setProjects(list);

        if (list.length === 0) return;

        // Load scans for all projects in parallel
        const allScans = await Promise.all(
          list.map(p => api.scans.listByProject(p.id).catch(() => [] as Scan[]))
        );

        const pairs: ProjectWithScan[] = list.map((p, i) => ({
          project: p,
          latestScan: allScans[i][0] ?? null,
        }));
        setProjectsWithScans(pairs);

        // Find the project whose most recent scan is the newest overall
        const withScans = pairs
          .filter(p => p.latestScan !== null)
          .sort((a, b) =>
            new Date(b.latestScan!.createdAt).getTime() -
            new Date(a.latestScan!.createdAt).getTime()
          );
        if (withScans[0]) {
          const featured = withScans[0];
          setLatestScan(featured.latestScan);
          const idx = list.findIndex(p => p.id === featured.project.id);
          setScanHistory(allScans[idx].slice().reverse()); // oldest first for chart
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

  // Chart data: each scan mapped to a data point (oldest → newest)
  const chartData = scanHistory.map((s, i) => ({
    name: i === 0
      ? (isRtl ? 'ראשון' : 'First')
      : i === scanHistory.length - 1
        ? (isRtl ? 'אחרון' : 'Latest')
        : new Date(s.createdAt).toLocaleDateString(isRtl ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' }),
    overall: s.overallScore ?? 0,
    performance: s.performanceScore ?? 0,
    seo: s.seoScore ?? 0,
  }));

  // Previous scan for diff badges (second from end in history = index length-2)
  const prevScan = scanHistory.length >= 2 ? scanHistory[scanHistory.length - 2] : null;

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
              <div className="flex items-center gap-3">
                {user?.credits !== undefined && (
                  <Link
                    href="/pricing"
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                      user.credits < 100
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                    }`}
                  >
                    <Zap className="h-4 w-4" />
                    {user.credits} {isRtl ? 'קרדיטים' : 'credits'}
                    {user.credits < 100 && <span className="ms-1 text-xs opacity-80">{isRtl ? '— רכשי עוד' : '— buy more'}</span>}
                  </Link>
                )}
                <Link href="/scan"><Button>{t.newScan} <ArrowRight className="ms-2 h-4 w-4" /></Button></Link>
              </div>
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
              {/* ── Latest scan + AI Insight ── */}
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
                        { label: t.scores.overall,       value: latestScan.overallScore,       prev: prevScan?.overallScore,       accent: 'text-[#F9FAFB]' },
                        { label: t.scores.performance,   value: latestScan.performanceScore,   prev: prevScan?.performanceScore,   accent: 'text-[#EC4899]' },
                        { label: t.scores.accessibility, value: latestScan.accessibilityScore, prev: prevScan?.accessibilityScore, accent: 'text-[#06B6D4]' },
                        { label: t.scores.seo,           value: latestScan.seoScore,           prev: prevScan?.seoScore,           accent: 'text-[#22C55E]' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm text-[#A1A1AA]">{s.label}</p>
                          <p className={`mt-2 text-3xl font-semibold ${s.accent}`}>{s.value ?? '—'}</p>
                          {prevScan && (
                            <div className="mt-1">
                              <ScoreDiff current={s.value ?? null} previous={s.prev ?? null} />
                            </div>
                          )}
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

              {/* ── Score history chart (only shown when ≥2 scans exist) ── */}
              {chartData.length >= 2 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-[#111827]/90">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-[#06B6D4]" />
                        {isRtl ? 'היסטוריית ציונים' : 'Score History'}
                      </CardTitle>
                      <CardDescription>
                        {isRtl ? 'מגמת הציון לאורך זמן עבור ' : 'Score trend over time for '}
                        {projects[0]?.domain}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                            labelStyle={{ color: '#F9FAFB', marginBottom: 4 }}
                            itemStyle={{ color: '#A1A1AA' }}
                          />
                          <Line type="monotone" dataKey="overall"     stroke="#F9FAFB" strokeWidth={2}   dot={{ fill: '#F9FAFB', r: 3 }} name={isRtl ? 'כולל' : 'Overall'} />
                          <Line type="monotone" dataKey="performance" stroke="#EC4899" strokeWidth={1.5} dot={false}                    name={isRtl ? 'ביצועים' : 'Performance'} />
                          <Line type="monotone" dataKey="seo"         stroke="#22C55E" strokeWidth={1.5} dot={false}                    name="SEO" />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="mt-3 flex items-center gap-4 text-xs text-[#A1A1AA]">
                        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-full bg-[#F9FAFB]" />{isRtl ? 'כולל' : 'Overall'}</span>
                        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-full bg-[#EC4899]" />{isRtl ? 'ביצועים' : 'Performance'}</span>
                        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-full bg-[#22C55E]" />SEO</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ── All projects ── */}
              {projectsWithScans.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-[#111827]/90">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-[#06B6D4]" />
                        {isRtl ? 'כל הפרויקטים' : 'All Projects'}
                      </CardTitle>
                      <CardDescription>
                        {isRtl ? 'סטטוס עדכני לכל האתרים שלך' : 'Latest status for all your sites'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {projectsWithScans.map(({ project, latestScan: ps }) => (
                          <div key={project.id}
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 gap-4 flex-wrap">
                            <div className="min-w-0">
                              <p className="font-medium text-[#F9FAFB] truncate">{project.name}</p>
                              <p className="text-xs text-[#A1A1AA] truncate">{project.domain}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {ps ? (
                                <>
                                  <div className="text-center">
                                    <p className="text-xs text-[#A1A1AA]">{isRtl ? 'ציון' : 'Score'}</p>
                                    <p className={`text-xl font-bold ${
                                      (ps.overallScore ?? 0) >= 80 ? 'text-emerald-400'
                                      : (ps.overallScore ?? 0) >= 60 ? 'text-yellow-400'
                                      : 'text-red-400'
                                    }`}>
                                      {ps.overallScore ?? '—'}
                                    </p>
                                  </div>
                                  <div className="text-center hidden sm:block">
                                    <p className="text-xs text-[#A1A1AA]">{isRtl ? 'תאריך' : 'Date'}</p>
                                    <p className="text-xs text-[#F9FAFB]">
                                      {new Date(ps.createdAt).toLocaleDateString(isRtl ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                  </div>
                                  <Link href={`/report/${ps.id}` as any}
                                    className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 rounded-lg px-3 py-1.5 whitespace-nowrap">
                                    {isRtl ? 'דוח' : 'Report'}
                                  </Link>
                                </>
                              ) : (
                                <Link href="/scan"
                                  className="text-xs text-[#EC4899] hover:text-pink-300 border border-pink-500/30 rounded-lg px-3 py-1.5">
                                  {isRtl ? 'סרוק עכשיו' : 'Scan now'}
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ── AI Priority Roadmap ── */}
              {roadmap.length > 0 && (
                <section>
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
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </ProtectedLayout>
  );
}
