"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Info, Zap, Search, Eye, Shield, Loader2, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { useLocale } from '@/contexts/locale';
import { api, type Scan, type AnalyzerResult, type AnalyzerIssue } from '@/lib/api';

const ANALYZER_META: Record<string, { label: string; labelHe: string; icon: React.ReactNode; color: string }> = {
  performance: { label: 'Performance', labelHe: 'ביצועים', icon: <Zap className="h-4 w-4" />, color: 'text-pink-400' },
  seo:         { label: 'SEO',         labelHe: 'SEO',      icon: <Search className="h-4 w-4" />, color: 'text-cyan-400' },
  accessibility:{ label: 'Accessibility', labelHe: 'נגישות', icon: <Eye className="h-4 w-4" />, color: 'text-violet-400' },
  security:    { label: 'Security',    labelHe: 'אבטחה',    icon: <Shield className="h-4 w-4" />, color: 'text-emerald-400' },
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'קריטי', high: 'גבוה', medium: 'בינוני', low: 'נמוך',
};

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform="rotate(-90 36 36)" className={color} />
      <text x="36" y="40" textAnchor="middle" fill="white" fontSize="15" fontWeight="600">{score}</text>
    </svg>
  );
}

function IssueCard({ issue, isRtl }: { issue: AnalyzerIssue; isRtl: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        className="w-full flex items-start gap-3 p-4 text-start hover:bg-white/[0.03] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className={`mt-0.5 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_BADGE[issue.severity]}`}>
          {SEVERITY_LABEL[issue.severity] ?? issue.severity}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#F9FAFB] leading-5">{issue.title}</p>
          {issue.estimatedImpact && (
            <p className="text-xs text-emerald-400 mt-0.5">{issue.estimatedImpact}</p>
          )}
        </div>
        <span className="text-[#A1A1AA] text-sm shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
          <p className="text-sm text-[#A1A1AA] leading-6">{issue.description}</p>

          <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-3">
            <p className="text-xs font-semibold text-violet-300 mb-1">{isRtl ? 'למה זה חשוב:' : 'Why it matters:'}</p>
            <p className="text-xs text-[#A1A1AA] leading-5">{issue.whyItMatters}</p>
          </div>

          <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3">
            <p className="text-xs font-semibold text-cyan-300 mb-1">{isRtl ? 'המלצה:' : 'Recommendation:'}</p>
            <p className="text-xs text-[#A1A1AA] leading-5">{issue.recommendation}</p>
          </div>

          {issue.affectedUrls && issue.affectedUrls.length > 0 && (
            <div className="rounded-xl bg-[#09090B] border border-white/10 p-3">
              <p className="text-xs font-semibold text-orange-300 mb-2">
                {isRtl ? `קבצים מושפעים (${issue.affectedUrls.length}):` : `Affected files (${issue.affectedUrls.length}):`}
              </p>
              <ul className="space-y-1">
                {issue.affectedUrls.map((u, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 text-[#A1A1AA]" />
                    <a href={u} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 break-all leading-4">{u}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {issue.details && !issue.affectedUrls?.length && (
            <pre className="rounded-xl bg-[#09090B] border border-white/10 p-3 text-xs text-[#A1A1AA] whitespace-pre-wrap break-all">
              {issue.details}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { locale } = useLocale();
  const isRtl = locale === 'he';

  const [scan, setScan] = useState<Scan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.scans.get(id).then(s => { setScan(s); setIsLoading(false); }).catch(() => {
      setIsLoading(false);
      router.push('/dashboard');
    });
  }, [id, router]);

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      </ProtectedLayout>
    );
  }

  if (!scan) return null;

  const raw: AnalyzerResult[] = (scan.rawResults as AnalyzerResult[] | null) ?? [];
  const totalIssues = raw.reduce((s, r) => s + r.issues.length, 0);
  const criticalCount = raw.reduce((s, r) => s + r.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length, 0);

  return (
    <ProtectedLayout>
      <main className="min-h-screen bg-transparent px-4 py-8 text-[#F9FAFB] sm:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Back */}
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#F9FAFB]">
            <ArrowLeft className="h-4 w-4" />
            {isRtl ? 'חזרה לדשבורד' : 'Back to dashboard'}
          </Link>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1e1b4b] to-[#111827] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400 mb-2">
              {isRtl ? 'דוח סריקה מלא' : 'Full Scan Report'}
            </p>
            <h1 className="text-2xl font-bold sm:text-3xl mb-1 break-all">{scan.url}</h1>
            <p className="text-sm text-[#A1A1AA]">
              {new Date(scan.createdAt).toLocaleDateString(isRtl ? 'he-IL' : 'en-US', { dateStyle: 'full' })}
            </p>

            {/* Score overview */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="col-span-2 sm:col-span-1 flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                <ScoreCircle score={scan.overallScore ?? 0} color="text-white" />
                <p className="text-xs text-[#A1A1AA]">{isRtl ? 'כולל' : 'Overall'}</p>
              </div>
              {[
                { key: 'performance', score: scan.performanceScore, color: 'text-pink-400' },
                { key: 'seo', score: scan.seoScore, color: 'text-cyan-400' },
                { key: 'accessibility', score: scan.accessibilityScore, color: 'text-violet-400' },
                { key: 'security', score: scan.securityScore, color: 'text-emerald-400' },
              ].map(({ key, score, color }) => {
                const meta = ANALYZER_META[key];
                return (
                  <div key={key} className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <ScoreCircle score={score ?? 0} color={color} />
                    <p className="text-xs text-[#A1A1AA]">{isRtl ? meta.labelHe : meta.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Summary stats */}
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 text-sm text-[#A1A1AA]">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                {isRtl ? `${totalIssues} בעיות סה"כ` : `${totalIssues} issues total`}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-[#A1A1AA]">
                <Info className="h-4 w-4 text-red-400" />
                {isRtl ? `${criticalCount} דחופות` : `${criticalCount} urgent`}
              </span>
              {totalIssues === 0 && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {isRtl ? 'לא נמצאו בעיות!' : 'No issues found!'}
                </span>
              )}
            </div>
          </motion.div>

          {/* AI Summary */}
          {scan.aiSummary && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
              <p className="text-xs font-semibold text-violet-300 mb-2">
                {isRtl ? '✨ סיכום AI' : '✨ AI Summary'}
              </p>
              <p className="text-sm text-[#F9FAFB] leading-7">{scan.aiSummary}</p>
            </div>
          )}

          {/* Per-analyzer sections */}
          {raw.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-[#A1A1AA] text-sm">
              {isRtl
                ? 'פרטי הסריקה לא זמינים לסריקה זו. הפעל סריקה חדשה כדי לראות דוח מלא.'
                : 'Detailed results not available for this scan. Run a new scan to see the full report.'}
            </div>
          )}

          {raw.map((result) => {
            const meta = ANALYZER_META[result.analyzer] ?? { label: result.analyzer, labelHe: result.analyzer, icon: null, color: 'text-white' };
            return (
              <motion.section key={result.analyzer}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#111827]/80 overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className={meta.color}>{meta.icon}</span>
                    <h2 className="font-semibold text-[#F9FAFB]">
                      {isRtl ? meta.labelHe : meta.label}
                    </h2>
                    <span className="text-xs text-[#A1A1AA]">
                      ({result.issues.length} {isRtl ? 'בעיות' : 'issues'})
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${meta.color}`}>{result.score}</div>
                </div>

                <div className="p-4 space-y-3">
                  {result.issues.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-400 py-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {isRtl ? 'לא נמצאו בעיות בקטגוריה זו' : 'No issues found in this category'}
                    </div>
                  ) : (
                    result.issues.map((issue, i) => (
                      <IssueCard key={i} issue={issue} isRtl={isRtl} />
                    ))
                  )}
                </div>
              </motion.section>
            );
          })}

          {/* Priority Roadmap */}
          {(scan.priorityRoadmap?.length ?? 0) > 0 && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-[#111827]/80 overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <h2 className="font-semibold text-[#F9FAFB] flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  {isRtl ? 'תוכנית פעולה מומלצת (AI)' : 'AI Priority Roadmap'}
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {(scan.priorityRoadmap ?? []).map((item) => (
                  <div key={item.rank} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-[#F9FAFB] text-sm">#{item.rank} {item.issue}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${SEVERITY_BADGE[item.impact === 'HIGH' ? 'high' : item.impact === 'MEDIUM' ? 'medium' : 'low']}`}>
                          {item.impact}
                        </span>
                        <span className="text-xs text-emerald-400">{item.expectedImprovement}</span>
                      </div>
                    </div>
                    {item.description && <p className="text-sm text-[#A1A1AA] leading-6">{item.description}</p>}
                    {item.howToFix && (
                      <div className="rounded-xl border border-white/10 bg-[#09090B]/60 p-3">
                        <p className="text-xs font-semibold text-cyan-300 mb-1">{isRtl ? 'איך לתקן:' : 'How to fix:'}</p>
                        <p className="text-xs text-[#A1A1AA] leading-5 whitespace-pre-line">{item.howToFix}</p>
                      </div>
                    )}
                    {item.codeExample && (
                      <pre className="rounded-xl border border-white/10 bg-[#09090B] p-3 text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">{item.codeExample}</pre>
                    )}
                  </div>
                ))}
              </div>
            </motion.section>
          )}

        </div>
      </main>
    </ProtectedLayout>
  );
}
