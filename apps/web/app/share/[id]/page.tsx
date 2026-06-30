"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  AlertTriangle, CheckCircle2, Zap, Search, Eye, Shield, Loader2,
  ExternalLink, Smartphone, Lock, Code2, FileCode2, Link2,
  ChevronDown, ChevronUp, TrendingUp, Globe,
} from 'lucide-react';
import Link from 'next/link';
import { api, type Scan, type AnalyzerResult, type AnalyzerIssue, type CWVData } from '@/lib/api';

// ── Analyzer metadata ────────────────────────────────────────────────────────

const ANALYZER_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  performance:      { label: 'Performance',   icon: <Zap className="h-4 w-4" />,        color: 'text-pink-400',    bg: 'bg-pink-500/10 border-pink-500/20' },
  seo:              { label: 'SEO',            icon: <Search className="h-4 w-4" />,     color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20' },
  accessibility:    { label: 'Accessibility',  icon: <Eye className="h-4 w-4" />,        color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
  security:         { label: 'Security',       icon: <Shield className="h-4 w-4" />,     color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  mobile:           { label: 'Mobile UX',      icon: <Smartphone className="h-4 w-4" />, color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
  privacy:          { label: 'Privacy / GDPR', icon: <Lock className="h-4 w-4" />,       color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20' },
  schema:           { label: 'Schema',         icon: <Code2 className="h-4 w-4" />,      color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'javascript-css': { label: 'JS / CSS',       icon: <FileCode2 className="h-4 w-4" />,  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  links:            { label: 'Links',          icon: <Link2 className="h-4 w-4" />,      color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/20' },
};

const SEV_BADGE: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const CWV_THRESHOLDS: Record<string, [number, number]> = {
  lcp: [2500, 4000], cls: [0.1, 0.25], inp: [200, 500], ttfb: [800, 1800],
};

function cwvCls(metric: string, value: number) {
  const [g, p] = CWV_THRESHOLDS[metric] ?? [0, 0];
  if (value <= g) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  if (value <= p) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
  return 'text-red-400 border-red-500/30 bg-red-500/10';
}

function ScoreRing({ score, color, size = 72 }: { score: number; color: string; size?: number }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${c} ${c})`} className={color} />
      <text x={c} y={c + 5} textAnchor="middle" fill="white" fontSize={size > 80 ? 18 : 14} fontWeight="700">{score}</text>
    </svg>
  );
}

function IssueCard({ issue }: { issue: AnalyzerIssue }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <button className="w-full flex items-start gap-3 p-4 text-start hover:bg-white/[0.03] transition-colors"
        onClick={() => setOpen(o => !o)}>
        <span className={`mt-0.5 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${SEV_BADGE[issue.severity]}`}>
          {issue.severity}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#F9FAFB]">{issue.title}</p>
          {issue.estimatedImpact && (
            <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />{issue.estimatedImpact}
            </p>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-[#A1A1AA] shrink-0 mt-0.5" />
               : <ChevronDown className="h-4 w-4 text-[#A1A1AA] shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
          <p className="text-sm text-[#A1A1AA] leading-6">{issue.description}</p>
          <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-3">
            <p className="text-xs font-semibold text-violet-300 mb-1">Why it matters:</p>
            <p className="text-xs text-[#A1A1AA] leading-5">{issue.whyItMatters}</p>
          </div>
          <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3">
            <p className="text-xs font-semibold text-cyan-300 mb-1">How to fix:</p>
            <p className="text-xs text-[#A1A1AA] leading-5">{issue.recommendation}</p>
          </div>
          {issue.affectedUrls && issue.affectedUrls.length > 0 && (
            <div className="rounded-xl bg-[#09090B] border border-white/10 p-3">
              <p className="text-xs font-semibold text-orange-300 mb-2">Affected ({issue.affectedUrls.length}):</p>
              <ul className="space-y-1">
                {issue.affectedUrls.slice(0, 6).map((u, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 text-[#A1A1AA]" />
                    <a href={u} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 break-all">{u}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {issue.resourceUrl && !issue.affectedUrls?.length && (
            <a href={issue.resourceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300">
              <ExternalLink className="h-3 w-3" /> Open resource
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.scans.getPublic(id)
      .then(setScan)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center gap-4 text-[#A1A1AA]">
      <Globe className="h-12 w-12 opacity-30" />
      <p className="text-lg">Report not found</p>
      <Link href="/" className="text-sm text-violet-400 hover:underline">Go to Optimizio</Link>
    </div>
  );

  if (!scan) return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
    </div>
  );

  const raw: AnalyzerResult[] = (scan.rawResults as any) ?? [];
  const totalIssues = raw.reduce((s, r) => s + r.issues.length, 0);
  const criticalCount = raw.reduce((s, r) => s + r.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length, 0);
  const cwv = scan.cwvData as CWVData | null;

  const scoreCards = [
    { key: 'performance', score: scan.performanceScore, color: 'text-pink-400' },
    { key: 'seo', score: scan.seoScore, color: 'text-cyan-400' },
    { key: 'accessibility', score: scan.accessibilityScore, color: 'text-violet-400' },
    { key: 'security', score: scan.securityScore, color: 'text-emerald-400' },
    { key: 'mobile', score: scan.mobileScore, color: 'text-orange-400' },
  ].filter(s => s.score !== null);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F9FAFB]">
      {/* Header bar */}
      <div className="border-b border-white/10 bg-[#111827]/80 px-6 py-4 flex items-center justify-between backdrop-blur">
        <Link href="/" className="text-sm font-bold tracking-tight text-[#F9FAFB]">
          ⚡ Optimizio
        </Link>
        <span className="text-xs text-[#A1A1AA]">Shared scan report</span>
        <Link href="/register"
          className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors">
          Get your free scan →
        </Link>
      </div>

      <main className="px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1e1b4b] to-[#111827] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400 mb-2">Full Scan Report</p>
            <h1 className="text-2xl font-bold sm:text-3xl mb-1 break-all">{scan.url}</h1>
            <p className="text-sm text-[#A1A1AA]">
              {new Date(scan.createdAt).toLocaleDateString('en-US', { dateStyle: 'full' })}
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
              <div className="col-span-3 sm:col-span-1 flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                <ScoreRing score={scan.overallScore ?? 0} color="text-white" size={80} />
                <p className="text-xs text-[#A1A1AA] font-medium">Overall</p>
              </div>
              {scoreCards.map(({ key, score, color }) => (
                <div key={key} className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <ScoreRing score={score ?? 0} color={color} />
                  <p className="text-xs text-[#A1A1AA] text-center capitalize">{ANALYZER_META[key]?.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span className="text-[#A1A1AA]">
                <AlertTriangle className="inline h-4 w-4 text-orange-400 mr-1" />
                {criticalCount} urgent issues
              </span>
              <span className="text-[#A1A1AA]">{totalIssues} total issues</span>
            </div>
          </motion.div>

          {/* CWV */}
          {cwv && cwv.psiScore !== null && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-[#111827]/80 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <h2 className="font-semibold">Core Web Vitals</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#A1A1AA]">PageSpeed:</span>
                  <span className={`text-2xl font-bold ${cwv.psiScore >= 90 ? 'text-emerald-400' : cwv.psiScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {cwv.psiScore}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                {([
                  { label: 'LCP', val: cwv.lcp, disp: cwv.lcpDisplay, m: 'lcp' },
                  { label: 'CLS', val: cwv.cls, disp: cwv.clsDisplay, m: 'cls' },
                  { label: 'INP', val: cwv.inp, disp: cwv.inpDisplay, m: 'inp' },
                  { label: 'TTFB', val: cwv.ttfb, disp: cwv.ttfbDisplay, m: 'ttfb' },
                ] as const).map(({ label, val, disp, m }) => val !== null ? (
                  <div key={label} className={`flex flex-col items-center gap-1 rounded-2xl border p-4 text-center ${cwvCls(m, val)}`}>
                    <p className="text-xs font-semibold opacity-80">{label}</p>
                    <p className="text-xl font-bold">{disp ?? val}</p>
                  </div>
                ) : null)}
              </div>
            </motion.div>
          )}

          {/* AI Summary */}
          {scan.aiSummary && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
              <p className="text-xs font-semibold text-violet-300 mb-2">✨ AI Summary</p>
              <p className="text-sm text-[#F9FAFB] leading-7">{scan.aiSummary}</p>
            </div>
          )}

          {/* Issues */}
          {raw.map(result => {
            const meta = ANALYZER_META[result.analyzer];
            if (!result.issues.length) return null;
            return (
              <motion.section key={result.analyzer}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#111827]/80 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl border p-2 ${meta?.bg ?? ''}`}>
                      <span className={meta?.color ?? 'text-white'}>{meta?.icon}</span>
                    </div>
                    <div>
                      <h2 className="font-semibold">{meta?.label ?? result.analyzer}</h2>
                      <p className="text-xs text-[#A1A1AA]">{result.issues.length} issues</p>
                    </div>
                  </div>
                  <span className={`text-3xl font-bold ${result.score >= 80 ? 'text-emerald-400' : result.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.score}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {result.issues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
                </div>
              </motion.section>
            );
          })}

          {/* CTA */}
          <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-[#111827] p-8 text-center space-y-4">
            <p className="text-xl font-semibold">Want to scan your website?</p>
            <p className="text-sm text-[#A1A1AA]">Get a free audit of your site — performance, SEO, accessibility, security and more.</p>
            <Link href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors">
              Start free scan →
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
