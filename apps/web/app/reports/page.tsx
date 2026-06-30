"use client";

import { motion } from 'framer-motion';
import { Download, Mail, FileText, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { useLocale } from '@/contexts/locale';
import { getDictionary } from '@/lib/i18n';
import { api, type Project, type Scan, type RoadmapItem } from '@/lib/api';

interface ScanWithProject extends Scan {
  projectName: string;
  projectDomain: string;
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-[#A1A1AA]';
  if (score >= 90) return 'text-[#22C55E]';
  if (score >= 70) return 'text-[#F59E0B]';
  return 'text-[#EF4444]';
}

function statusBadge(status: string, t: { completed: string; pending: string; failed: string; running: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: t.completed, cls: 'bg-[#22C55E]/20 text-[#22C55E]' },
    pending:   { label: t.pending,   cls: 'bg-[#F59E0B]/20 text-[#F59E0B]' },
    running:   { label: t.running,   cls: 'bg-[#06B6D4]/20 text-[#06B6D4]' },
    failed:    { label: t.failed,    cls: 'bg-[#EF4444]/20 text-[#EF4444]' },
  };
  const s = map[status] ?? map.pending;
  return <Badge className={s.cls}>{s.label}</Badge>;
}

export default function ReportsPage() {
  const { locale } = useLocale();
  const t = getDictionary(locale).reports;
  const isRtl = locale === 'he';
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';

  const [scans, setScans] = useState<ScanWithProject[]>([]);
  const [selected, setSelected] = useState<ScanWithProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const projects: Project[] = await api.projects.list();
        const allScans: ScanWithProject[] = [];
        await Promise.all(
          projects.map(async (p) => {
            const projectScans = await api.scans.listByProject(p.id);
            projectScans.forEach((s) =>
              allScans.push({ ...s, projectName: p.name, projectDomain: p.domain }),
            );
          }),
        );
        allScans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setScans(allScans);
        if (allScans.length > 0) setSelected(allScans[0]);
      } catch {
        // empty state
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <ProtectedLayout>
      <main className="min-h-screen bg-transparent px-6 py-8 text-[#F9FAFB] sm:px-8 lg:px-12" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mx-auto max-w-6xl flex flex-col gap-8">

          <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827] to-[#18181B] p-8 shadow-glow">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.3em] text-[#EC4899]">
              <FileText className="h-4 w-4" /> {t.title}
            </div>
            <h1 className="text-3xl font-semibold sm:text-4xl">{t.subtitle}</h1>
          </motion.header>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-[#A1A1AA]" />
            </div>
          ) : scans.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-6 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827] to-[#18181B] p-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#EC4899]/20 via-[#8B5CF6]/20 to-[#3B82F6]/20">
                <Plus className="h-8 w-8 text-[#F9FAFB]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t.noReports}</h2>
                <p className="mt-2 text-sm text-[#A1A1AA]">{t.noReportsDesc}</p>
              </div>
              <Link href="/scan"><Button>{t.startScan}</Button></Link>
            </motion.div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">

              {/* List */}
              <Card className="bg-[#111827]/90 h-fit" data-no-print>
                <CardHeader>
                  <CardTitle>{t.recentReports}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scans.map((scan) => (
                      <button
                        key={scan.id}
                        onClick={() => setSelected(scan)}
                        className={`w-full rounded-xl border p-3 text-${isRtl ? 'right' : 'left'} transition ${
                          selected?.id === scan.id
                            ? 'border-[#EC4899]/40 bg-[#EC4899]/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-sm">{scan.projectDomain}</p>
                            <p className="text-xs text-[#A1A1AA]">
                              {new Date(scan.createdAt).toLocaleDateString(dateLocale)}
                            </p>
                          </div>
                          {scan.overallScore !== null ? (
                            <span className={`shrink-0 text-sm font-semibold ${scoreColor(scan.overallScore)}`}>
                              {scan.overallScore}
                            </span>
                          ) : (
                            statusBadge(scan.status, t.status)
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detail */}
              {selected ? (
                <motion.div key={selected.id} initial={{ opacity: 0, x: isRtl ? -16 : 16 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="bg-[#111827]/90 print-report">
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle>{selected.projectDomain}</CardTitle>
                          <CardDescription>
                            {new Date(selected.createdAt).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </CardDescription>
                        </div>
                        {selected.overallScore !== null
                          ? <Badge className="bg-[#22C55E]/20 text-[#22C55E] text-base px-3">{selected.overallScore}/100</Badge>
                          : statusBadge(selected.status, t.status)
                        }
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">

                      {/* Summary */}
                      {selected.aiSummary && (
                        <div>
                          <h3 className="mb-2 font-semibold">{t.executiveSummary}</h3>
                          <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-[#A1A1AA]">
                            {selected.aiSummary}
                          </p>
                        </div>
                      )}

                      {/* Score bars */}
                      {selected.overallScore !== null && (
                        <div className="space-y-3">
                          {[
                            { label: t.scores.overall,       value: selected.overallScore },
                            { label: t.scores.performance,   value: selected.performanceScore },
                            { label: t.scores.accessibility, value: selected.accessibilityScore },
                            { label: t.scores.seo,           value: selected.seoScore },
                            { label: t.scores.security,      value: selected.securityScore },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between gap-3">
                              <span className="w-32 shrink-0 text-sm text-[#A1A1AA]">{item.label}</span>
                              <div className="h-2 flex-1 rounded-full bg-white/10">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] transition-all duration-700"
                                  style={{ width: `${item.value ?? 0}%` }}
                                />
                              </div>
                              <span className={`w-8 shrink-0 text-sm font-semibold text-right ${scoreColor(item.value)}`}>
                                {item.value ?? '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No summary placeholder */}
                      {!selected.aiSummary && selected.overallScore === null && (
                        <p className="text-sm text-[#A1A1AA]">{t.noSummary}</p>
                      )}

                      {/* Roadmap */}
                      {selected.priorityRoadmap && (selected.priorityRoadmap as RoadmapItem[]).length > 0 && (
                        <div ref={printRef}>
                          <h3 className="mb-3 font-semibold">{isRtl ? 'מפת דרכים עדיפויות' : 'Priority Roadmap'}</h3>
                          <div className="space-y-3">
                            {(selected.priorityRoadmap as RoadmapItem[]).map((item) => (
                              <div key={item.rank} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-semibold text-[#F9FAFB]">#{item.rank} {item.issue}</p>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.impact === 'HIGH' ? 'bg-red-500/20 text-red-400' : item.impact === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>{item.impact}</span>
                                    <span className="text-xs text-[#22C55E]">{item.expectedImprovement}</span>
                                  </div>
                                </div>
                                {item.resourceUrl && (
                                  <p className="text-xs text-[#06B6D4] break-all">{item.resourceUrl}</p>
                                )}
                                {item.description && (
                                  <p className="text-sm text-[#A1A1AA] leading-6">{item.description}</p>
                                )}
                                {item.howToFix && (
                                  <div className="rounded-xl border border-white/10 bg-[#09090B]/60 p-3">
                                    <p className="text-xs font-medium text-[#06B6D4] mb-1">{isRtl ? 'איך לתקן:' : 'How to fix:'}</p>
                                    <p className="text-xs text-[#A1A1AA] leading-5 whitespace-pre-line">{item.howToFix}</p>
                                  </div>
                                )}
                                {item.codeExample && (
                                  <pre className="rounded-xl border border-white/10 bg-[#09090B] p-3 text-xs text-[#22C55E] overflow-x-auto whitespace-pre-wrap dir-ltr text-left">{item.codeExample}</pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="border-t border-white/10 pt-4 grid gap-2" data-no-print>
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => {
                            // inject print-only header then print
                            const title = document.title;
                            document.title = `Optimizio — ${selected.projectDomain} — ${new Date(selected.createdAt).toLocaleDateString(dateLocale)}`;
                            window.print();
                            document.title = title;
                          }}
                        >
                          <Download className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                          {t.downloadPdf}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            const roadmap = (selected.priorityRoadmap as RoadmapItem[] | null) ?? [];
                            const subject = encodeURIComponent(
                              `Optimizio Report — ${selected.projectDomain} — ${selected.overallScore ?? '—'}/100`
                            );
                            const lines = [
                              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                              `📊 Optimizio Performance Report`,
                              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                              ``,
                              `${isRtl ? 'אתר' : 'Website'}: ${selected.projectDomain}`,
                              `${isRtl ? 'תאריך' : 'Date'}: ${new Date(selected.createdAt).toLocaleDateString(dateLocale)}`,
                              ``,
                              `📈 ${isRtl ? 'ציונים' : 'Scores'}`,
                              `  ${isRtl ? 'כולל' : 'Overall'}:        ${selected.overallScore ?? '—'}/100`,
                              `  ${isRtl ? 'ביצועים' : 'Performance'}:  ${selected.performanceScore ?? '—'}/100`,
                              `  ${isRtl ? 'נגישות' : 'Accessibility'}: ${selected.accessibilityScore ?? '—'}/100`,
                              `  SEO:           ${selected.seoScore ?? '—'}/100`,
                              `  ${isRtl ? 'אבטחה' : 'Security'}:      ${selected.securityScore ?? '—'}/100`,
                              ``,
                              selected.aiSummary ? `🤖 ${isRtl ? 'סיכום AI' : 'AI Summary'}` : '',
                              selected.aiSummary ? selected.aiSummary : '',
                              ``,
                              roadmap.length > 0 ? `🗺️ ${isRtl ? 'מפת דרכים עדיפויות' : 'Priority Roadmap'}` : '',
                              ...roadmap.map(item =>
                                [
                                  ``,
                                  `#${item.rank} ${item.issue} [${item.impact}] ${item.expectedImprovement}`,
                                  item.description || '',
                                  item.howToFix ? `${isRtl ? 'איך לתקן' : 'Fix'}: ${item.howToFix}` : '',
                                  item.codeExample ? `Code: ${item.codeExample}` : '',
                                ].filter(Boolean).join('\n')
                              ),
                              ``,
                              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                              `Optimizio Performance | optimizio.app`,
                            ].filter(l => l !== undefined);

                            const body = encodeURIComponent(lines.join('\n'));
                            window.location.href = `mailto:?subject=${subject}&body=${body}`;
                          }}
                        >
                          <Mail className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                          {t.emailReport}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center rounded-[32px] border border-white/10 bg-[#111827]/50 p-16 text-sm text-[#A1A1AA]">
                  {t.selectReport}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </ProtectedLayout>
  );
}
