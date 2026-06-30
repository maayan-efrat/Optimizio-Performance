"use client";

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Trophy, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { useLocale } from '@/contexts/locale';
import { api, type CompareResult } from '@/lib/api';

const METRICS = [
  { key: 'performance',   label: 'Performance',   labelHe: 'ביצועים',    color: '#EC4899' },
  { key: 'seo',           label: 'SEO',            labelHe: 'SEO',         color: '#22C55E' },
  { key: 'accessibility', label: 'Accessibility',  labelHe: 'נגישות',      color: '#06B6D4' },
  { key: 'security',      label: 'Security',       labelHe: 'אבטחה',       color: '#8B5CF6' },
  { key: 'mobile',        label: 'Mobile',         labelHe: 'מובייל',      color: '#F59E0B' },
  { key: 'privacy',       label: 'Privacy',        labelHe: 'פרטיות',      color: '#F43F5E' },
];

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function ScoreBar({ score, color, max }: { score: number; color: string; max: number }) {
  const pct = max > 0 ? (score / max) * 100 : score;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className={`w-8 text-right text-sm font-semibold ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

export default function CompetitorAnalysisPage() {
  const { locale } = useLocale();
  const isRtl = locale === 'he';

  const [yourUrl, setYourUrl]   = useState('');
  const [comp1, setComp1]       = useState('');
  const [comp2, setComp2]       = useState('');
  const [comp3, setComp3]       = useState('');
  const [results, setResults]   = useState<CompareResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState('');

  async function handleCompare() {
    const urls = [yourUrl, comp1, comp2, comp3].map(u => u.trim()).filter(Boolean);
    if (urls.length < 2) {
      setError(isRtl ? 'יש להזין לפחות 2 כתובות URL' : 'Enter at least 2 URLs to compare');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const data = await api.scans.compare(urls);
      setResults(data);
    } catch {
      setError(isRtl ? 'שגיאה בסריקה — בדקי שהכתובות תקינות' : 'Scan error — check that all URLs are reachable');
    } finally {
      setIsLoading(false);
    }
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#09090B] text-[#F9FAFB] outline-none focus:border-violet-500 transition-colors placeholder:text-[#A1A1AA]';

  return (
    <ProtectedLayout>
      <main className="min-h-screen bg-transparent px-6 py-8 text-[#F9FAFB] sm:px-8 lg:px-12" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mx-auto max-w-5xl flex flex-col gap-8">

          {/* Header */}
          <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827] to-[#18181B] p-8 shadow-glow">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.3em] text-[#F59E0B]">
              <Trophy className="h-4 w-4" />
              {isRtl ? 'ניתוח מתחרים' : 'Competitor Analysis'}
            </div>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              {isRtl ? 'השווה את האתר שלך למתחרים' : 'Compare your site against competitors'}
            </h1>
            <p className="mt-2 text-[#A1A1AA]">
              {isRtl ? 'הזיני עד 4 כתובות URL לניתוח מקביל — ללא צורך בסריקה מלאה' : 'Enter up to 4 URLs for parallel analysis — no full scan required'}
            </p>
          </motion.header>

          {/* Input form */}
          <Card className="bg-[#111827]/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-violet-400" />
                {isRtl ? 'הזיני כתובות URL' : 'Enter URLs to compare'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#F9FAFB]">
                    {isRtl ? '🏠 האתר שלך' : '🏠 Your website'}
                  </label>
                  <input type="url" value={yourUrl} onChange={e => setYourUrl(e.target.value)}
                    placeholder="https://yoursite.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#A1A1AA]">
                    {isRtl ? 'מתחרה 1' : 'Competitor 1'}
                  </label>
                  <input type="url" value={comp1} onChange={e => setComp1(e.target.value)}
                    placeholder="https://competitor1.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#A1A1AA]">
                    {isRtl ? 'מתחרה 2 (אופציונלי)' : 'Competitor 2 (optional)'}
                  </label>
                  <input type="url" value={comp2} onChange={e => setComp2(e.target.value)}
                    placeholder="https://competitor2.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#A1A1AA]">
                    {isRtl ? 'מתחרה 3 (אופציונלי)' : 'Competitor 3 (optional)'}
                  </label>
                  <input type="url" value={comp3} onChange={e => setComp3(e.target.value)}
                    placeholder="https://competitor3.com" className={inputCls} />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <Button onClick={handleCompare} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{isRtl ? 'סורק...' : 'Scanning...'}</> : (isRtl ? 'השוואה' : 'Run comparison')}
              </Button>
              {isLoading && (
                <p className="text-xs text-[#A1A1AA]">
                  {isRtl ? 'סריקה מהירה — בד"כ 10-30 שניות לפי מספר האתרים' : 'Quick scan — usually 10-30s depending on site count'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {results && results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

              {/* Ranking */}
              <Card className="bg-[#111827]/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-[#F59E0B]" />
                    {isRtl ? 'דירוג כולל' : 'Overall ranking'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...results]
                      .sort((a, b) => b.overall - a.overall)
                      .map((r, rank) => {
                        const isYours = r.url === yourUrl.trim();
                        return (
                          <div key={r.url} className={`flex items-center justify-between rounded-2xl border p-4 gap-4 ${
                            isYours ? 'border-violet-500/40 bg-violet-500/10' : 'border-white/10 bg-white/5'
                          }`}>
                            <div className="flex items-center gap-4 min-w-0">
                              <span className={`text-2xl font-bold shrink-0 ${rank === 0 ? 'text-[#F59E0B]' : 'text-[#A1A1AA]'}`}>
                                {rank + 1}.
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium text-[#F9FAFB] truncate">
                                  {isYours ? (isRtl ? '🏠 האתר שלך' : '🏠 Your site') : new URL(r.url).hostname}
                                </p>
                                <p className="text-xs text-[#A1A1AA] truncate">{r.url}</p>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className={`text-3xl font-bold ${scoreColor(r.overall)}`}>{r.overall}</p>
                              <p className="text-xs text-[#A1A1AA]">/100</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed comparison table */}
              <Card className="bg-[#111827]/90">
                <CardHeader>
                  <CardTitle>{isRtl ? 'השוואה מפורטת לפי קטגוריה' : 'Detailed comparison by category'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {METRICS.map(metric => {
                      const values = results.map(r => ({ url: r.url, score: r.scores[metric.key] ?? 0 }));
                      const maxScore = Math.max(...values.map(v => v.score));
                      const leader = values.find(v => v.score === maxScore);

                      return (
                        <div key={metric.key}>
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-medium text-[#F9FAFB]">{isRtl ? metric.labelHe : metric.label}</p>
                            {leader && (
                              <p className="text-xs text-[#A1A1AA] flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                {leader.url === yourUrl.trim() ? (isRtl ? 'האתר שלך מוביל' : 'Your site leads') : new URL(leader.url).hostname}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            {values.map(v => (
                              <div key={v.url} className="grid grid-cols-[1fr_auto] items-center gap-3">
                                <div>
                                  <p className="text-xs text-[#A1A1AA] mb-1 truncate">
                                    {v.url === yourUrl.trim() ? (isRtl ? '🏠 האתר שלך' : '🏠 Your site') : new URL(v.url).hostname}
                                  </p>
                                  <ScoreBar score={v.score} color={metric.color} max={maxScore || 100} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Strengths & opportunities */}
              {(() => {
                const yours = results.find(r => r.url === yourUrl.trim());
                if (!yours) return null;

                const strengths = METRICS.filter(m => {
                  const myScore = yours.scores[m.key] ?? 0;
                  const allScores = results.map(r => r.scores[m.key] ?? 0);
                  return myScore === Math.max(...allScores);
                });
                const opportunities = METRICS.filter(m => {
                  const myScore = yours.scores[m.key] ?? 0;
                  const allScores = results.filter(r => r.url !== yours.url).map(r => r.scores[m.key] ?? 0);
                  return allScores.some(s => s > myScore + 5);
                });

                return (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="bg-[#111827]/90">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="h-5 w-5" />
                          {isRtl ? 'יתרונות שלך' : 'Your strengths'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {strengths.length > 0 ? (
                          <ul className="space-y-2">
                            {strengths.map(m => (
                              <li key={m.key} className="flex items-center gap-2 text-sm text-emerald-400">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                {isRtl ? m.labelHe : m.label} — {isRtl ? 'מוביל את כל המתחרים' : 'leads all competitors'}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-[#A1A1AA]">{isRtl ? 'אין קטגוריה שבה אתה מוביל' : 'No categories where you lead yet'}</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-[#111827]/90">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-400">
                          <AlertCircle className="h-5 w-5" />
                          {isRtl ? 'הזדמנויות לשיפור' : 'Opportunities'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {opportunities.length > 0 ? (
                          <ul className="space-y-2">
                            {opportunities.map(m => {
                              const myScore = yours.scores[m.key] ?? 0;
                              const best = Math.max(...results.filter(r => r.url !== yours.url).map(r => r.scores[m.key] ?? 0));
                              return (
                                <li key={m.key} className="flex items-start gap-2 text-sm text-[#A1A1AA]">
                                  <AlertCircle className="h-4 w-4 shrink-0 text-yellow-400 mt-0.5" />
                                  <span>
                                    {isRtl ? m.labelHe : m.label} — {isRtl ? `${myScore} לעומת ${best} של המתחרה המוביל` : `your score ${myScore} vs competitor best ${best}`}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-sm text-[#A1A1AA]">{isRtl ? 'אין הזדמנויות ברורות — מצוין!' : 'No clear gaps — great job!'}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </div>
      </main>
    </ProtectedLayout>
  );
}
