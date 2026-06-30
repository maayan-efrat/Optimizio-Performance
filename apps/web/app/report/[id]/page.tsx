"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Info, Zap, Search, Eye, Shield,
  Loader2, ExternalLink, Smartphone, Lock, Code2, FileCode2, Link2, Printer,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Share2, Check,
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { useLocale } from '@/contexts/locale';
import { api, type Scan, type AnalyzerResult, type AnalyzerIssue, type CWVData } from '@/lib/api';

// ── Analyzer metadata ────────────────────────────────────────────────────────

const ANALYZER_META: Record<string, { label: string; labelHe: string; icon: React.ReactNode; color: string; bg: string }> = {
  performance:      { label: 'Performance',   labelHe: 'ביצועים',    icon: <Zap className="h-4 w-4" />,        color: 'text-pink-400',    bg: 'bg-pink-500/10 border-pink-500/20' },
  seo:              { label: 'SEO',            labelHe: 'SEO',         icon: <Search className="h-4 w-4" />,     color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20' },
  accessibility:    { label: 'Accessibility',  labelHe: 'נגישות',      icon: <Eye className="h-4 w-4" />,        color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
  security:         { label: 'Security',       labelHe: 'אבטחה',       icon: <Shield className="h-4 w-4" />,     color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  mobile:           { label: 'Mobile UX',      labelHe: 'מובייל',      icon: <Smartphone className="h-4 w-4" />, color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
  privacy:          { label: 'Privacy / GDPR', labelHe: 'פרטיות',      icon: <Lock className="h-4 w-4" />,       color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20' },
  schema:           { label: 'Schema',         labelHe: 'Schema',      icon: <Code2 className="h-4 w-4" />,      color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'javascript-css': { label: 'JS / CSS',       labelHe: 'JS / CSS',    icon: <FileCode2 className="h-4 w-4" />,  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  links:            { label: 'Links',          labelHe: 'קישורים',     icon: <Link2 className="h-4 w-4" />,      color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/20' },
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const SEVERITY_LABEL_HE: Record<string, string> = {
  critical: 'קריטי', high: 'גבוה', medium: 'בינוני', low: 'נמוך',
};
const SEVERITY_LABEL_EN: Record<string, string> = {
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
};

// ── CWV helpers ───────────────────────────────────────────────────────────────

const CWV_THRESHOLDS: Record<string, [number, number]> = {
  lcp: [2500, 4000], cls: [0.1, 0.25], inp: [200, 500], ttfb: [800, 1800],
};

function cwvColorClass(metric: string, value: number) {
  const [good, poor] = CWV_THRESHOLDS[metric] ?? [0, 0];
  if (value <= good) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  if (value <= poor) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
  return 'text-red-400 border-red-500/30 bg-red-500/10';
}

function cwvLabel(metric: string, value: number, isRtl: boolean) {
  const [good, poor] = CWV_THRESHOLDS[metric] ?? [0, 0];
  if (isRtl) {
    if (value <= good) return 'טוב';
    if (value <= poor) return 'דורש שיפור';
    return 'גרוע';
  }
  if (value <= good) return 'Good';
  if (value <= poor) return 'Needs work';
  return 'Poor';
}

function psiScoreColor(score: number | null) {
  if (score === null) return 'text-[#A1A1AA]';
  if (score >= 90) return 'text-emerald-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

// ── Metadata stats bar ────────────────────────────────────────────────────────

type MetaValue = string | number | boolean | null | string[];

function StatPill({ label, value, ok }: { label: string; value: string | number; ok?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 ${
      ok === undefined ? 'border-white/10 bg-white/5' :
      ok ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-red-500/20 bg-red-500/10'
    }`}>
      <span className="text-xs text-[#A1A1AA]">{label}</span>
      <span className={`text-xs font-semibold ${ok === undefined ? 'text-[#F9FAFB]' : ok ? 'text-emerald-400' : 'text-red-400'}`}>{value}</span>
    </div>
  );
}

function MetaBar({ analyzer, meta, isRtl }: { analyzer: string; meta: Record<string, unknown>; isRtl: boolean }) {
  const pills: React.ReactNode[] = [];

  if (analyzer === 'seo') {
    if (meta.wordCount != null)     pills.push(<StatPill key="wc"  label={isRtl ? 'מילים' : 'Words'}           value={meta.wordCount as number} ok={(meta.wordCount as number) >= 300} />);
    if (meta.titleLength != null)   pills.push(<StatPill key="tl"  label={isRtl ? 'כותרת' : 'Title'}           value={`${meta.titleLength} ch`} ok={(meta.titleLength as number) >= 20 && (meta.titleLength as number) <= 65} />);
    if (meta.metaDescLength != null) pills.push(<StatPill key="md" label={isRtl ? 'תיאור' : 'Description'}     value={`${meta.metaDescLength} ch`} ok={(meta.metaDescLength as number) >= 60 && (meta.metaDescLength as number) <= 165} />);
    if (meta.h1Count != null)       pills.push(<StatPill key="h1"  label="H1"                                  value={meta.h1Count as number} ok={meta.h1Count === 1} />);
    if (meta.h2Count != null)       pills.push(<StatPill key="h2"  label="H2"                                  value={meta.h2Count as number} ok={(meta.h2Count as number) > 0} />);
    if (meta.internalLinks != null) pills.push(<StatPill key="il"  label={isRtl ? 'קישורים פנימיים' : 'Internal links'} value={meta.internalLinks as number} />);
    if (meta.externalLinks != null) pills.push(<StatPill key="el"  label={isRtl ? 'קישורים חיצוניים' : 'External links'} value={meta.externalLinks as number} />);
    if (meta.hasOgTags != null)     pills.push(<StatPill key="og"  label="Open Graph"                         value={meta.hasOgTags ? '✓' : '✗'} ok={meta.hasOgTags as boolean} />);
    if (meta.hasCanonical != null)  pills.push(<StatPill key="cn"  label="Canonical"                          value={meta.hasCanonical ? '✓' : '✗'} ok={meta.hasCanonical as boolean} />);
    if (meta.hasSitemap != null)    pills.push(<StatPill key="sm"  label="Sitemap"                            value={meta.hasSitemap ? '✓' : '✗'} ok={meta.hasSitemap as boolean} />);
    if (meta.hasRobotsTxt != null)  pills.push(<StatPill key="rb"  label="Robots.txt"                         value={meta.hasRobotsTxt ? '✓' : '✗'} ok={meta.hasRobotsTxt as boolean} />);
  }

  if (analyzer === 'performance') {
    if (meta.fetchDurationMs != null) pills.push(<StatPill key="dt" label={isRtl ? 'זמן תגובה' : 'TTFB'} value={`${meta.fetchDurationMs}ms`} ok={(meta.fetchDurationMs as number) < 800} />);
    if (meta.htmlSizeKb != null)     pills.push(<StatPill key="hs" label={isRtl ? 'גודל HTML' : 'HTML size'} value={`${meta.htmlSizeKb}KB`} ok={(meta.htmlSizeKb as number) < 200} />);
    if (meta.imageCount != null)     pills.push(<StatPill key="ic" label={isRtl ? 'תמונות' : 'Images'}    value={`${meta.largeImageCount ?? 0}/${meta.imageCount} large`} ok={(meta.largeImageCount as number) === 0} />);
    if (meta.externalScripts != null) pills.push(<StatPill key="sc" label={isRtl ? 'סקריפטים' : 'Scripts'} value={meta.externalScripts as number} ok={(meta.externalScripts as number) <= 10} />);
    if (meta.renderBlockingScripts != null) pills.push(<StatPill key="rb" label={isRtl ? 'חוסמים' : 'Blocking'} value={meta.renderBlockingScripts as number} ok={(meta.renderBlockingScripts as number) === 0} />);
    if (meta.externalFonts != null)  pills.push(<StatPill key="fn" label={isRtl ? 'גופנים' : 'Fonts'}    value={meta.externalFonts as number} ok={(meta.externalFonts as number) <= 1} />);
    if (meta.hasPreconnect != null)  pills.push(<StatPill key="pc" label="Preconnect"                    value={meta.hasPreconnect ? '✓' : '✗'} ok={meta.hasPreconnect as boolean} />);
    if (meta.hasPreload != null)     pills.push(<StatPill key="pl" label="Preload"                       value={meta.hasPreload ? '✓' : '✗'} ok={meta.hasPreload as boolean} />);
  }

  if (analyzer === 'security') {
    if (meta.isHttps != null)        pills.push(<StatPill key="ht" label="HTTPS"                             value={meta.isHttps ? '✓' : '✗'} ok={meta.isHttps as boolean} />);
    if (meta.hasCsp != null)         pills.push(<StatPill key="cs" label="CSP"                               value={meta.hasCsp ? '✓' : '✗'} ok={meta.hasCsp as boolean} />);
    if (meta.presentSecurityHeaders) {
      const present = meta.presentSecurityHeaders as string[];
      pills.push(<StatPill key="sh" label={isRtl ? 'כותרות אבטחה' : 'Security headers'} value={`${present.length}/6`} ok={present.length >= 4} />);
    }
    if (meta.serverHeader)           pills.push(<StatPill key="sv" label="Server" value={String(meta.serverHeader).slice(0, 20)} ok={false} />);
    if (meta.xPoweredBy)             pills.push(<StatPill key="xp" label="X-Powered-By" value={String(meta.xPoweredBy).slice(0, 20)} ok={false} />);
  }

  if (analyzer === 'accessibility') {
    if (meta.hasLangAttr != null)    pills.push(<StatPill key="la" label={isRtl ? 'שפה' : 'lang attr'} value={meta.langValue ? String(meta.langValue) : '✗'} ok={meta.hasLangAttr as boolean} />);
    if (meta.imageCount != null)     pills.push(<StatPill key="ia" label={isRtl ? 'תמונות עם alt' : 'Images with alt'} value={`${meta.imagesWithAlt}/${meta.imageCount}`} ok={(meta.imagesWithAlt as number) === (meta.imageCount as number)} />);
    if (meta.headingStructure)       pills.push(<StatPill key="hs" label={isRtl ? 'מבנה כותרות' : 'Headings'} value={String(meta.headingStructure)} />);
    if (meta.inputCount != null && (meta.inputCount as number) > 0) pills.push(<StatPill key="in" label={isRtl ? 'שדות' : 'Inputs'} value={`${meta.labelCount}/${meta.inputCount} labeled`} ok={(meta.labelCount as number) >= (meta.inputCount as number)} />);
  }

  if (pills.length === 0) return null;

  return (
    <div className="px-4 pb-1 pt-2">
      <div className="flex flex-wrap gap-2">
        {pills}
      </div>
    </div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 72 }: { score: number; color: string; size?: number }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;
  const center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle cx={center} cy={center} r={r} fill="none" stroke="currentColor" strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`} className={color} />
      <text x={center} y={center + 5} textAnchor="middle" fill="white"
        fontSize={size > 80 ? 18 : 14} fontWeight="700">{score}</text>
    </svg>
  );
}

// ── Issue card (accordion) ───────────────────────────────────────────────────

function IssueCard({ issue, isRtl }: { issue: AnalyzerIssue; isRtl: boolean }) {
  const [open, setOpen] = useState(false);
  const sevLabel = isRtl ? (SEVERITY_LABEL_HE[issue.severity] ?? issue.severity)
                          : (SEVERITY_LABEL_EN[issue.severity] ?? issue.severity);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-all">
      <button
        className="w-full flex items-start gap-3 p-4 text-start hover:bg-white/[0.03] transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className={`mt-0.5 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_BADGE[issue.severity]}`}>
          {sevLabel}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#F9FAFB] leading-5">{issue.title}</p>
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
            <p className="text-xs font-semibold text-violet-300 mb-1">
              {isRtl ? 'למה זה חשוב:' : 'Why it matters:'}
            </p>
            <p className="text-xs text-[#A1A1AA] leading-5">{issue.whyItMatters}</p>
          </div>

          <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3">
            <p className="text-xs font-semibold text-cyan-300 mb-1">
              {isRtl ? 'המלצה:' : 'How to fix:'}
            </p>
            <p className="text-xs text-[#A1A1AA] leading-5">{issue.recommendation}</p>
          </div>

          {issue.affectedUrls && issue.affectedUrls.length > 0 && (
            <div className="rounded-xl bg-[#09090B] border border-white/10 p-3">
              <p className="text-xs font-semibold text-orange-300 mb-2">
                {isRtl ? `URLs מושפעים (${issue.affectedUrls.length}):` : `Affected (${issue.affectedUrls.length}):`}
              </p>
              <ul className="space-y-1">
                {issue.affectedUrls.slice(0, 8).map((u, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 text-[#A1A1AA]" />
                    <a href={u} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 break-all leading-4">{u}</a>
                  </li>
                ))}
                {issue.affectedUrls.length > 8 && (
                  <li className="text-xs text-[#A1A1AA]">
                    {isRtl ? `ועוד ${issue.affectedUrls.length - 8}...` : `+${issue.affectedUrls.length - 8} more`}
                  </li>
                )}
              </ul>
            </div>
          )}

          {issue.details && !issue.affectedUrls?.length && (
            <pre className="rounded-xl bg-[#09090B] border border-white/10 p-3 text-xs text-[#A1A1AA] whitespace-pre-wrap break-all">
              {issue.details}
            </pre>
          )}

          {issue.resourceUrl && (
            <a href={issue.resourceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300">
              <ExternalLink className="h-3 w-3" />
              {isRtl ? 'פתח קובץ' : 'Open resource'}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── CWV metric card ───────────────────────────────────────────────────────────

function CWVCard({ label, display, value, metric, isRtl }: {
  label: string; display: string | null; value: number | null;
  metric: string; isRtl: boolean;
}) {
  if (value === null) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
        <p className="text-xs font-semibold text-[#A1A1AA]">{label}</p>
        <p className="text-xl font-bold text-[#A1A1AA]">—</p>
        <p className="text-xs text-[#A1A1AA]">{isRtl ? 'לא זמין' : 'N/A'}</p>
      </div>
    );
  }
  const cls = cwvColorClass(metric, value);
  const status = cwvLabel(metric, value, isRtl);
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-center ${cls}`}>
      <p className="text-xs font-semibold opacity-80">{label}</p>
      <p className="text-xl font-bold">{display ?? value}</p>
      <p className="text-xs font-medium">{status}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { locale } = useLocale();
  const isRtl = locale === 'he';

  const [scan, setScan] = useState<Scan | null>(null);
  const [prevScan, setPrevScan] = useState<Scan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.scans.get(id)
      .then(async (s) => {
        setScan(s);
        // Load scan history to find the previous scan for comparison
        try {
          const history = await api.scans.listByProject(s.projectId);
          const currentIndex = history.findIndex(h => h.id === s.id);
          if (currentIndex !== -1 && currentIndex < history.length - 1) {
            setPrevScan(history[currentIndex + 1]); // list is newest-first
          }
        } catch { /* comparison is optional */ }
        setIsLoading(false);
      })
      .catch(() => { setIsLoading(false); router.push('/dashboard'); });
  }, [id, router]);

  function handleShare() {
    const url = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isLoading) return (
    <ProtectedLayout>
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    </ProtectedLayout>
  );

  if (!scan) return null;

  const raw: AnalyzerResult[] = (scan.rawResults as AnalyzerResult[] | null) ?? [];
  const allIssues = raw.flatMap(r => r.issues.map(i => ({ ...i, _analyzer: r.analyzer })));
  const totalIssues = allIssues.length;
  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const highCount     = allIssues.filter(i => i.severity === 'high').length;
  const cwv = scan.cwvData as CWVData | null;
  const hasCWV = cwv && (cwv.psiScore !== null || cwv.lcp !== null);

  const scoreCards = [
    { key: 'performance',    score: scan.performanceScore,   color: 'text-pink-400' },
    { key: 'seo',            score: scan.seoScore,           color: 'text-cyan-400' },
    { key: 'accessibility',  score: scan.accessibilityScore, color: 'text-violet-400' },
    { key: 'security',       score: scan.securityScore,      color: 'text-emerald-400' },
    { key: 'mobile',         score: scan.mobileScore,        color: 'text-orange-400' },
    { key: 'privacy',        score: scan.privacyScore,       color: 'text-rose-400' },
    { key: 'schema',         score: scan.schemaScore,        color: 'text-yellow-400' },
    { key: 'javascript-css', score: scan.jsCssScore,         color: 'text-blue-400' },
  ].filter(s => s.score !== null);

  // Filter issues across all analyzers for the issues tab
  const filteredRaw = raw.map(r => ({
    ...r,
    issues: activeFilter === 'all' ? r.issues : r.issues.filter(i => i.severity === activeFilter),
  })).filter(r => r.issues.length > 0);

  return (
    <ProtectedLayout>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          nav, header { display: none !important; }
          body { background: white !important; color: #111 !important; }
          .rounded-2xl, .rounded-3xl { border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      <main className="min-h-screen bg-transparent px-4 py-8 text-[#F9FAFB] sm:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Topbar */}
          <div className="flex items-center justify-between no-print">
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#F9FAFB] transition-colors">
              <ArrowLeft className="h-4 w-4" />
              {isRtl ? 'חזרה לדשבורד' : 'Back to dashboard'}
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${
                  copied
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/10 bg-white/5 text-[#A1A1AA] hover:bg-white/10'
                }`}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                {copied ? (isRtl ? 'הועתק!' : 'Copied!') : (isRtl ? 'שיתוף' : 'Share')}
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#A1A1AA] hover:bg-white/10 transition-colors">
                <Printer className="h-3.5 w-3.5" />
                {isRtl ? 'ייצוא PDF' : 'Export PDF'}
              </button>
            </div>
          </div>

          {/* ── Header card ─────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1e1b4b] to-[#111827] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400 mb-2">
              {isRtl ? 'דוח סריקה מלא' : 'Full Scan Report'}
            </p>
            <h1 className="text-2xl font-bold sm:text-3xl mb-1 break-all">{scan.url}</h1>
            <p className="text-sm text-[#A1A1AA]">
              {new Date(scan.createdAt).toLocaleDateString(isRtl ? 'he-IL' : 'en-US', { dateStyle: 'full' })}
            </p>

            {/* Overall + category rings */}
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
              {/* Overall */}
              <div className="col-span-3 sm:col-span-1 flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                <ScoreRing score={scan.overallScore ?? 0} color="text-white" size={80} />
                <p className="text-xs text-[#A1A1AA] font-medium">{isRtl ? 'כולל' : 'Overall'}</p>
              </div>
              {scoreCards.map(({ key, score, color }) => {
                const meta = ANALYZER_META[key];
                return (
                  <div key={key} className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <ScoreRing score={score ?? 0} color={color} />
                    <p className="text-xs text-[#A1A1AA] text-center leading-tight">
                      {isRtl ? meta?.labelHe : meta?.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Stats row */}
            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-[#A1A1AA]">{criticalCount} {isRtl ? 'קריטיות' : 'critical'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                <span className="text-[#A1A1AA]">{highCount} {isRtl ? 'גבוהות' : 'high'}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#A1A1AA]" />
                <span className="text-[#A1A1AA]">{totalIssues} {isRtl ? 'בעיות סה"כ' : 'total issues'}</span>
              </div>
              {totalIssues === 0 && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {isRtl ? 'האתר נקי לחלוטין!' : 'No issues found!'}
                </div>
              )}
              {/* Previous scan comparison */}
              {prevScan && scan.overallScore !== null && prevScan.overallScore !== null && (() => {
                const diff = (scan.overallScore ?? 0) - (prevScan.overallScore ?? 0);
                return (
                  <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-medium ${
                    diff > 0 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : diff < 0 ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-white/10 bg-white/5 text-[#A1A1AA]'
                  }`}>
                    {diff > 0 ? <TrendingUp className="h-3 w-3" />
                      : diff < 0 ? <TrendingDown className="h-3 w-3" />
                      : <Minus className="h-3 w-3" />}
                    {diff > 0 ? `+${diff}` : diff} {isRtl ? 'מהסריקה הקודמת' : 'vs prev scan'}
                  </div>
                );
              })()}
            </div>
          </motion.div>

          {/* ── Core Web Vitals ─────────────────────────────────────────────── */}
          {hasCWV && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-[#111827]/80 overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <h2 className="font-semibold">Core Web Vitals</h2>
                  <span className="text-xs text-[#A1A1AA]">{isRtl ? '— מדד גוגל' : '— Google benchmark'}</span>
                </div>
                {cwv?.psiScore !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#A1A1AA]">PageSpeed:</span>
                    <span className={`text-2xl font-bold ${psiScoreColor(cwv?.psiScore ?? null)}`}>
                      {cwv?.psiScore}
                    </span>
                    <span className="text-xs text-[#A1A1AA]">/100</span>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <CWVCard label="LCP"  display={cwv?.lcpDisplay  ?? null} value={cwv?.lcp  ?? null} metric="lcp"  isRtl={isRtl} />
                  <CWVCard label="CLS"  display={cwv?.clsDisplay  ?? null} value={cwv?.cls  ?? null} metric="cls"  isRtl={isRtl} />
                  <CWVCard label="INP"  display={cwv?.inpDisplay  ?? null} value={cwv?.inp  ?? null} metric="inp"  isRtl={isRtl} />
                  <CWVCard label="TTFB" display={cwv?.ttfbDisplay ?? null} value={cwv?.ttfb ?? null} metric="ttfb" isRtl={isRtl} />
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-[#A1A1AA] space-y-1">
                  <p>• LCP {isRtl ? '(Largest Contentful Paint) — זמן טעינת האלמנט הגדול. טוב: < 2.5s' : '(Largest Contentful Paint) — load time of largest element. Good: < 2.5s'}</p>
                  <p>• CLS {isRtl ? '(Cumulative Layout Shift) — קפיצות פריסה. טוב: < 0.1' : '(Cumulative Layout Shift) — visual instability. Good: < 0.1'}</p>
                  <p>• INP {isRtl ? '(Interaction to Next Paint) — תגובה לקליק. טוב: < 200ms' : '(Interaction to Next Paint) — click response. Good: < 200ms'}</p>
                  <p>• TTFB {isRtl ? '(Time to First Byte) — תגובת השרת. טוב: < 800ms' : '(Time to First Byte) — server response. Good: < 800ms'}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── AI Summary ──────────────────────────────────────────────────── */}
          {scan.aiSummary && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
              <p className="text-xs font-semibold text-violet-300 mb-2 flex items-center gap-1.5">
                ✨ {isRtl ? 'סיכום AI' : 'AI Summary'}
              </p>
              <p className="text-sm text-[#F9FAFB] leading-7">{scan.aiSummary}</p>
            </motion.div>
          )}

          {/* ── Severity filter bar ─────────────────────────────────────────── */}
          {raw.length > 0 && (
            <div className="flex flex-wrap gap-2 no-print">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map(f => {
                const counts: Record<string, number> = {
                  all: totalIssues,
                  critical: allIssues.filter(i => i.severity === 'critical').length,
                  high:     allIssues.filter(i => i.severity === 'high').length,
                  medium:   allIssues.filter(i => i.severity === 'medium').length,
                  low:      allIssues.filter(i => i.severity === 'low').length,
                };
                const labels = isRtl
                  ? { all: 'הכל', critical: 'קריטי', high: 'גבוה', medium: 'בינוני', low: 'נמוך' }
                  : { all: 'All', critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
                return (
                  <button key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeFilter === f
                        ? f === 'all' ? 'border-white/30 bg-white/10 text-[#F9FAFB]'
                          : SEVERITY_BADGE[f] ?? 'border-white/30 bg-white/10 text-[#F9FAFB]'
                        : 'border-white/10 text-[#A1A1AA] hover:border-white/20 hover:text-[#F9FAFB]'
                    }`}>
                    {labels[f]} ({counts[f]})
                  </button>
                );
              })}
            </div>
          )}

          {/* ── No data ─────────────────────────────────────────────────────── */}
          {raw.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-[#A1A1AA] text-sm">
              {isRtl
                ? 'פרטי הסריקה לא זמינים. הפעל סריקה חדשה כדי לראות דוח מלא.'
                : 'Detailed results not available. Run a new scan to see the full report.'}
            </div>
          )}

          {/* ── Per-analyzer sections ───────────────────────────────────────── */}
          {filteredRaw.map((result) => {
            const meta = ANALYZER_META[result.analyzer] ?? {
              label: result.analyzer, labelHe: result.analyzer,
              icon: null, color: 'text-white', bg: 'bg-white/5 border-white/10',
            };
            const scoreColor = result.score >= 80 ? 'text-emerald-400'
              : result.score >= 60 ? 'text-yellow-400'
              : 'text-red-400';

            return (
              <motion.section key={result.analyzer}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#111827]/80 overflow-hidden">

                {/* Section header */}
                <div className="flex items-center justify-between gap-3 p-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl border p-2 ${meta.bg}`}>
                      <span className={meta.color}>{meta.icon}</span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-[#F9FAFB]">
                        {isRtl ? meta.labelHe : meta.label}
                      </h2>
                      <p className="text-xs text-[#A1A1AA]">
                        {result.issues.length} {isRtl ? 'בעיות' : 'issues'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-3xl font-bold ${scoreColor}`}>{result.score}</span>
                    <span className="text-xs text-[#A1A1AA]">/100</span>
                  </div>
                </div>

                {/* Metadata stats bar */}
                {result.metadata && Object.keys(result.metadata).length > 0 && (
                  <MetaBar analyzer={result.analyzer} meta={result.metadata} isRtl={isRtl} />
                )}

                {/* Issues list */}
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

          {/* ── AI Priority Roadmap ─────────────────────────────────────────── */}
          {(scan.priorityRoadmap?.length ?? 0) > 0 && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-[#111827]/80 overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <h2 className="font-semibold text-[#F9FAFB] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-400" />
                  {isRtl ? 'תוכנית פעולה מומלצת (AI)' : 'AI Priority Roadmap'}
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  {isRtl ? 'ממוין לפי השפעה — תקן ברצף זה לשיפור מקסימלי' : 'Sorted by impact — fix in this order for best results'}
                </p>
              </div>
              <div className="p-4 space-y-3">
                {(scan.priorityRoadmap ?? []).map((item) => (
                  <div key={item.rank}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                          {item.rank}
                        </span>
                        <p className="font-semibold text-[#F9FAFB] text-sm">{item.issue}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          SEVERITY_BADGE[item.impact === 'HIGH' ? 'high' : item.impact === 'MEDIUM' ? 'medium' : 'low']
                        }`}>{item.impact}</span>
                        <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />{item.expectedImprovement}
                        </span>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-sm text-[#A1A1AA] leading-6">{item.description}</p>
                    )}
                    {item.howToFix && (
                      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                        <p className="text-xs font-semibold text-cyan-300 mb-1">
                          {isRtl ? 'צעדי תיקון:' : 'How to fix:'}
                        </p>
                        <p className="text-xs text-[#A1A1AA] leading-5 whitespace-pre-line">{item.howToFix}</p>
                      </div>
                    )}
                    {item.codeExample && (
                      <pre className="rounded-xl border border-white/10 bg-[#09090B] p-3 text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                        {item.codeExample}
                      </pre>
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
