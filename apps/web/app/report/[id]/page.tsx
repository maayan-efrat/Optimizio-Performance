"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Info, Zap, Search, Eye, Shield,
  Loader2, ExternalLink, Smartphone, Lock, Code2, FileCode2, Link2, Printer,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Share2, Check, Bot, X,
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { useLocale } from '@/contexts/locale';
import { useAuth } from '@/contexts/auth';
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
    if (meta.wordCount != null)       pills.push(<StatPill key="wc"  label={isRtl ? 'מילים' : 'Words'}             value={meta.wordCount as number} ok={(meta.wordCount as number) >= 300} />);
    if (meta.readingTimeMin != null)  pills.push(<StatPill key="rt"  label={isRtl ? 'זמן קריאה' : 'Read time'}     value={`${meta.readingTimeMin} min`} />);
    if (meta.titleLength != null)     pills.push(<StatPill key="tl"  label={isRtl ? 'כותרת' : 'Title'}             value={`${meta.titleLength} ch`} ok={(meta.titleLength as number) >= 20 && (meta.titleLength as number) <= 65} />);
    if (meta.metaDescLength != null)  pills.push(<StatPill key="md"  label={isRtl ? 'תיאור' : 'Description'}       value={`${meta.metaDescLength} ch`} ok={(meta.metaDescLength as number) >= 60 && (meta.metaDescLength as number) <= 165} />);
    if (meta.h1Count != null)         pills.push(<StatPill key="h1"  label="H1"                                    value={meta.h1Count as number} ok={meta.h1Count === 1} />);
    if (meta.h2Count != null)         pills.push(<StatPill key="h2"  label="H2"                                    value={meta.h2Count as number} ok={(meta.h2Count as number) > 0} />);
    if (meta.internalLinks != null)   pills.push(<StatPill key="il"  label={isRtl ? 'קישורים פנימיים' : 'Internal'} value={meta.internalLinks as number} />);
    if (meta.externalLinks != null)   pills.push(<StatPill key="el"  label={isRtl ? 'חיצוניים' : 'External'}       value={meta.externalLinks as number} />);
    if (meta.hasOgTags != null)       pills.push(<StatPill key="og"  label="OG"                                    value={meta.hasOgTags ? '✓' : '✗'} ok={meta.hasOgTags as boolean} />);
    if (meta.hasCanonical != null)    pills.push(<StatPill key="cn"  label="Canonical"                             value={meta.hasCanonical ? '✓' : '✗'} ok={meta.hasCanonical as boolean} />);
    if (meta.hasSitemap != null)      pills.push(<StatPill key="sm"  label="Sitemap"                               value={meta.hasSitemap ? '✓' : '✗'} ok={meta.hasSitemap as boolean} />);
    if (meta.hasRobotsTxt != null)    pills.push(<StatPill key="rb"  label="Robots.txt"                            value={meta.hasRobotsTxt ? '✓' : '✗'} ok={meta.hasRobotsTxt as boolean} />);
    if (meta.hasManifest != null)     pills.push(<StatPill key="mf"  label="PWA"                                   value={meta.hasManifest ? '✓' : '✗'} ok={meta.hasManifest as boolean} />);
    if (meta.hasContactInfo != null)  pills.push(<StatPill key="ci"  label={isRtl ? 'פרטי קשר' : 'Contact'}        value={meta.hasContactInfo ? '✓' : '✗'} ok={meta.hasContactInfo as boolean} />);
    if (meta.hasClickToCall != null)  pills.push(<StatPill key="tc"  label="tel:"                                   value={meta.hasClickToCall ? '✓' : '✗'} ok={meta.hasClickToCall as boolean} />);
    if (meta.hasWhatsApp != null)     pills.push(<StatPill key="wa"  label="WhatsApp"                               value={meta.hasWhatsApp ? '✓' : '✗'} ok={meta.hasWhatsApp as boolean} />);
    if (meta.hasSocialShare != null)  pills.push(<StatPill key="ss"  label={isRtl ? 'שיתוף' : 'Social share'}      value={meta.hasSocialShare ? '✓' : '✗'} ok={meta.hasSocialShare as boolean} />);
    if (meta.detectedCms)            pills.push(<StatPill key="cms" label="CMS"                                    value={String(meta.detectedCms)} />);
    if (meta.detectedFramework)      pills.push(<StatPill key="fw"  label="Framework"                              value={String(meta.detectedFramework)} />);
  }

  if (analyzer === 'performance') {
    if (meta.fetchDurationMs != null)      pills.push(<StatPill key="dt"  label={isRtl ? 'זמן תגובה' : 'TTFB'}        value={`${meta.fetchDurationMs}ms`} ok={(meta.fetchDurationMs as number) < 800} />);
    if (meta.compression != null)          pills.push(<StatPill key="gz"  label={isRtl ? 'דחיסה' : 'Compression'}     value={String(meta.compression)} ok={meta.compression !== 'none'} />);
    if (meta.hasCacheControl != null)      pills.push(<StatPill key="cc"  label="Cache"                               value={meta.hasCacheControl ? '✓' : '✗'} ok={meta.hasCacheControl as boolean} />);
    if (meta.htmlSizeKb != null)           pills.push(<StatPill key="hs"  label={isRtl ? 'גודל HTML' : 'HTML'}         value={`${meta.htmlSizeKb}KB`} ok={(meta.htmlSizeKb as number) < 200} />);
    if (meta.imageCount != null)           pills.push(<StatPill key="ic"  label={isRtl ? 'תמונות' : 'Images'}          value={`${meta.largeImageCount ?? 0}/${meta.imageCount} large`} ok={(meta.largeImageCount as number) === 0} />);
    if (meta.brokenImageCount != null && (meta.brokenImageCount as number) > 0)
                                           pills.push(<StatPill key="bi"  label={isRtl ? 'שבורות' : 'Broken imgs'}     value={meta.brokenImageCount as number} ok={false} />);
    if (meta.pageWeightKb != null)         pills.push(<StatPill key="pw"  label={isRtl ? 'משקל עמוד' : 'Page weight'}   value={`~${meta.pageWeightKb}KB`} ok={(meta.pageWeightKb as number) < 1500} />);
    if (meta.loadTime3g != null)           pills.push(<StatPill key="3g"  label="3G load"                              value={`~${meta.loadTime3g}s`} ok={(meta.loadTime3g as number) < 4} />);
    if (meta.externalScripts != null)      pills.push(<StatPill key="sc"  label={isRtl ? 'סקריפטים' : 'Scripts'}       value={meta.externalScripts as number} ok={(meta.externalScripts as number) <= 10} />);
    if (meta.thirdPartyScripts != null && (meta.thirdPartyScripts as number) > 0)
                                           pills.push(<StatPill key="3ps" label={isRtl ? 'צד ג׳' : '3rd party'}        value={meta.thirdPartyScripts as number} ok={(meta.thirdPartyScripts as number) <= 3} />);
    if (meta.renderBlockingScripts != null) pills.push(<StatPill key="rbs" label={isRtl ? 'JS חוסם' : 'Blocking JS'}  value={meta.renderBlockingScripts as number} ok={(meta.renderBlockingScripts as number) === 0} />);
    if (meta.renderBlockingCss != null && (meta.renderBlockingCss as number) > 3)
                                           pills.push(<StatPill key="rbc" label={isRtl ? 'CSS חוסם' : 'Blocking CSS'}  value={meta.renderBlockingCss as number} ok={false} />);
    if (meta.externalFonts != null)        pills.push(<StatPill key="fn"  label={isRtl ? 'גופנים' : 'Fonts'}           value={meta.externalFonts as number} ok={(meta.externalFonts as number) <= 1} />);
    if (meta.hasPreconnect != null)        pills.push(<StatPill key="pc"  label="Preconnect"                           value={meta.hasPreconnect ? '✓' : '✗'} ok={meta.hasPreconnect as boolean} />);
    if (meta.hasPreload != null)           pills.push(<StatPill key="pl"  label="Preload"                              value={meta.hasPreload ? '✓' : '✗'} ok={meta.hasPreload as boolean} />);
  }

  if (analyzer === 'security') {
    if (meta.isHttps != null)              pills.push(<StatPill key="ht"  label="HTTPS"                            value={meta.isHttps ? '✓' : '✗'} ok={meta.isHttps as boolean} />);
    if (meta.httpRedirectsToHttps != null) pills.push(<StatPill key="hrd" label={isRtl ? 'ריידרקט HTTP' : 'HTTP→HTTPS'} value={meta.httpRedirectsToHttps ? '✓' : '✗'} ok={meta.httpRedirectsToHttps as boolean} />);
    if (meta.hasCsp != null)               pills.push(<StatPill key="cs"  label="CSP"                             value={meta.hasCsp ? '✓' : '✗'} ok={meta.hasCsp as boolean} />);
    if (meta.presentSecurityHeaders) {
      const present = meta.presentSecurityHeaders as string[];
      pills.push(<StatPill key="sh" label={isRtl ? 'כותרות אבטחה' : 'Sec headers'} value={`${present.length}/6`} ok={present.length >= 4} />);
    }
    if ((meta.cdnScriptsWithoutSri as number) > 0) pills.push(<StatPill key="sri" label="SRI" value={`${meta.cdnScriptsWithoutSri} missing`} ok={false} />);
    if (meta.serverHeader)                 pills.push(<StatPill key="sv"  label="Server"                          value={String(meta.serverHeader).slice(0, 20)} ok={false} />);
    if (meta.xPoweredBy)                   pills.push(<StatPill key="xp"  label="X-Powered-By"                    value={String(meta.xPoweredBy).slice(0, 20)} ok={false} />);
  }

  if (analyzer === 'javascript-css') {
    if (meta.jsFileCount != null)   pills.push(<StatPill key="jc"  label={isRtl ? 'קבצי JS' : 'JS files'}      value={meta.jsFileCount as number} ok={(meta.jsFileCount as number) <= 12} />);
    if (meta.cssFileCount != null)  pills.push(<StatPill key="cc"  label={isRtl ? 'קבצי CSS' : 'CSS files'}    value={meta.cssFileCount as number} ok={(meta.cssFileCount as number) <= 5} />);
    if (meta.totalJsKb != null)     pills.push(<StatPill key="jk"  label={isRtl ? 'סך JS' : 'Total JS'}        value={`${meta.totalJsKb}KB`} ok={(meta.totalJsKb as number) < 600} />);
    if (meta.unminifiedJs != null && (meta.unminifiedJs as number) > 0)
                                    pills.push(<StatPill key="umj" label={isRtl ? 'JS לא מוקטן' : 'Unminified JS'} value={meta.unminifiedJs as number} ok={false} />);
    if (meta.unminifiedCss != null && (meta.unminifiedCss as number) > 0)
                                    pills.push(<StatPill key="umc" label={isRtl ? 'CSS לא מוקטן' : 'Unminified CSS'} value={meta.unminifiedCss as number} ok={false} />);
  }

  if (analyzer === 'privacy') {
    if (meta.trackerCount != null)       pills.push(<StatPill key="tc"  label={isRtl ? 'טרקרים' : 'Trackers'}        value={meta.trackerCount as number} ok={(meta.trackerCount as number) === 0} />);
    if (meta.highRiskCount != null && (meta.highRiskCount as number) > 0)
                                         pills.push(<StatPill key="hr"  label={isRtl ? 'סיכון גבוה' : 'High risk'}    value={meta.highRiskCount as number} ok={false} />);
    if (meta.hasConsentBanner != null)   pills.push(<StatPill key="cb"  label={isRtl ? 'הסכמה' : 'Cookie consent'}   value={meta.hasConsentBanner ? '✓' : '✗'} ok={meta.hasConsentBanner as boolean} />);
    if (meta.hasPrivacyPolicy != null)   pills.push(<StatPill key="pp"  label={isRtl ? 'פרטיות' : 'Privacy policy'}  value={meta.hasPrivacyPolicy ? '✓' : '✗'} ok={meta.hasPrivacyPolicy as boolean} />);
    if (meta.hasAnalytics != null)       pills.push(<StatPill key="an"  label={isRtl ? 'אנליטיקס' : 'Analytics'}     value={meta.hasAnalytics ? '✓' : '✗'} ok={meta.hasAnalytics as boolean} />);
  }

  if (analyzer === 'links') {
    if (meta.checkedLinks != null)       pills.push(<StatPill key="cl"  label={isRtl ? 'נבדקו' : 'Checked'}          value={meta.checkedLinks as number} />);
    if (meta.brokenLinks != null)        pills.push(<StatPill key="bl"  label={isRtl ? 'שבורים' : 'Broken'}          value={meta.brokenLinks as number} ok={(meta.brokenLinks as number) === 0} />);
    if (meta.redirectedLinks != null && (meta.redirectedLinks as number) > 0)
                                         pills.push(<StatPill key="rl"  label={isRtl ? 'הפניות' : 'Redirects'}       value={meta.redirectedLinks as number} ok={false} />);
    if (meta.hasCustom404 != null)       pills.push(<StatPill key="404" label="Custom 404"                            value={meta.hasCustom404 ? '✓' : '✗'} ok={meta.hasCustom404 as boolean} />);
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

      <div className={`px-4 pb-4 space-y-3 border-t border-white/10 pt-3 issue-detail-body${open ? '' : ' issue-detail-body--closed'}`}>
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
  const { refreshCredits } = useAuth();
  const isRtl = locale === 'he';

  const [scan, setScan] = useState<Scan | null>(null);
  const [prevScan, setPrevScan] = useState<Scan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [copied, setCopied] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportUserContext, setExportUserContext] = useState('');
  const [exportLang, setExportLang] = useState<'he' | 'en'>('he');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<'copy' | 'chatgpt' | 'claude' | null>(null);
  const [exportCount, setExportCount] = useState<number | null>(null);
  const [exportHistory, setExportHistory] = useState<Array<{ id: string; userContext: string; lang: string; createdAt: string }>>([]);

  useEffect(() => {
    api.scans.get(id)
      .then(async (s) => {
        setScan(s);
        api.scans.getExportCount(s.id).then(({ count }) => setExportCount(count)).catch(() => {});
        api.scans.getExports(s.id).then(list => setExportHistory(list)).catch(() => {});
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

  function buildExportPrompt(ctx: string, lang: 'he' | 'en'): string {
    if (!scan) return '';
    const raw: AnalyzerResult[] = (scan.rawResults as AnalyzerResult[] | null) ?? [];
    const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const he = lang === 'he';
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(scan.url);
    const DEV_KEYWORDS = ['https', 'ssl', 'tls', 'hsts', 'not minif', 'unminif', 'minification', 'compress', 'gzip', 'brotli', 'inline script', 'inline <script'];
    const lines: string[] = [];

    if (isLocalhost) {
      lines.push(he
        ? '⚠️ סביבת פיתוח (localhost): בעיות HTTPS, מינוף קבצים ודחיסה אינן רלוונטיות לפרודקשן ולא נכללו.'
        : '⚠️ Development environment (localhost): HTTPS, minification, and compression issues are not relevant to production and have been excluded.'
      );
      lines.push('');
    }
    if (ctx.trim()) {
      lines.push(he ? `מידע על האתר: ${ctx.trim()}` : `Website context: ${ctx.trim()}`);
      lines.push('');
    }
    lines.push(he
      ? `אתה מומחה לביצועי אתרים ו-SEO. סרקתי את האתר: ${scan.url}`
      : `You are a web performance and SEO expert. I scanned the website: ${scan.url}`
    );
    lines.push(he
      ? `ציון כולל: ${scan.overallScore ?? '?'}/100`
      : `Overall score: ${scan.overallScore ?? '?'}/100`
    );
    lines.push('');
    lines.push(he
      ? `להלן כל הבעיות שנמצאו, מקובצות לפי קטגוריה. ספק תוכנית פעולה מתעדפת לתיקונן, החל מהקריטיות ביותר.`
      : `Below are all the issues found, grouped by category. Please provide a prioritized action plan to fix them, starting with the most critical ones.`
    );
    lines.push('');

    for (const result of raw) {
      const issues = isLocalhost
        ? result.issues.filter(i => {
            const text = `${i.title} ${i.description}`.toLowerCase();
            return !DEV_KEYWORDS.some(k => text.includes(k));
          })
        : result.issues;
      if (!issues.length) continue;
      const meta = ANALYZER_META[result.analyzer];
      const label = meta ? (he ? meta.labelHe : meta.label) : result.analyzer;
      lines.push(`## ${label} — ${he ? 'ציון' : 'Score'}: ${result.score}/100`);
      const sorted = [...issues].sort((a, b) =>
        (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9)
      );
      for (const issue of sorted) {
        const sev = he ? SEVERITY_LABEL_HE[issue.severity] : SEVERITY_LABEL_EN[issue.severity];
        lines.push(`### [${sev}] ${issue.title}`);
        if (issue.description)     lines.push(`${he ? 'תיאור' : 'Description'}: ${issue.description}`);
        if (issue.whyItMatters)    lines.push(`${he ? 'למה זה חשוב' : 'Why it matters'}: ${issue.whyItMatters}`);
        if (issue.recommendation)  lines.push(`${he ? 'כיצד לתקן' : 'How to fix'}: ${issue.recommendation}`);
        if (issue.estimatedImpact) lines.push(`${he ? 'השפעה צפויה' : 'Expected impact'}: ${issue.estimatedImpact}`);
        lines.push('');
      }
    }

    if (scan.aiSummary) {
      lines.push(`## ${he ? 'סיכום AI' : 'AI Summary'}`);
      lines.push(scan.aiSummary);
      lines.push('');
    }

    lines.push(he
      ? `תעדוף את התיקונים לפי השפעה ומאמץ, והסבר כל תיקון בבהירות.`
      : `Please prioritize fixes by impact and effort, and explain each fix clearly.`
    );
    return lines.join('\n');
  }

  async function handleExportAction(action: 'copy' | 'chatgpt' | 'claude') {
    if (!scan) return;
    setExportLoading(true);
    try {
      const { exportCount: newCount } = await api.scans.saveExport(scan.id, exportUserContext, exportLang);
      const prompt = buildExportPrompt(exportUserContext, exportLang);
      await navigator.clipboard.writeText(prompt);
      await refreshCredits();
      setExportCount(newCount);
      api.scans.getExports(scan.id).then(list => setExportHistory(list)).catch(() => {});
      setExportSuccess(action);

      if (action === 'chatgpt') window.open('https://chatgpt.com/', '_blank');
      if (action === 'claude')  window.open('https://claude.ai/new', '_blank');

      setTimeout(() => {
        setExportSuccess(null);
        setExportLoading(false);
        setShowExportModal(false);
      }, 2000);
    } catch (err) {
      setExportLoading(false);
      const msg = err instanceof Error ? err.message : '';
      alert(isRtl
        ? `לא ניתן לייצא: ${msg || 'שגיאה'}`
        : `Export failed: ${msg || 'error'}`
      );
    }
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
        .issue-detail-body--closed { display: none; }

        @media print {
          .no-print { display: none !important; }
          nav, header { display: none !important; }
          body { background: white !important; color: #111 !important; }
          .print-logo { display: flex !important; }
          .issue-detail-body--closed { display: block !important; }
          .rounded-2xl, .rounded-3xl { border: 1px solid #d1d5db !important; background: #f9fafb !important; }
          p, span, h1, h2, h3, div { color: #111 !important; }
          .text-\\[\\#A1A1AA\\], .text-\\[\\#64748B\\] { color: #555 !important; }
          section, .rounded-2xl { page-break-inside: avoid; margin-bottom: 16px; }
          pre { background: #f3f4f6 !important; border: 1px solid #d1d5db !important; color: #111 !important; }
          a { color: #2563eb !important; }
        }
      `}</style>

      <main className="min-h-screen bg-transparent px-4 py-8 text-[#F9FAFB] sm:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Print-only logo header */}
        <div className="print-logo hidden items-center gap-3 mb-6 pb-4 border-b border-gray-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Optimizio Performance</span>
          <span className="ml-auto text-sm text-gray-500">{new Date(scan.createdAt).toLocaleDateString(isRtl ? 'he-IL' : 'en-US', { dateStyle: 'full' })}</span>
        </div>

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
                onClick={() => setShowExportModal(true)}
                dir="ltr"
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/25 hover:border-violet-500/60 transition-all">
                <Bot className="h-3.5 w-3.5 shrink-0" />
                {isRtl ? 'ייצוא לAI' : 'Export to AI'}
                <span className="rounded-md bg-violet-400/25 border border-violet-400/40 px-1.5 py-0.5 text-[10px] font-bold text-violet-100 leading-none">
                  200 ⚡
                </span>
                {exportCount !== null && exportCount > 0 && (
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-[#A1A1AA]">×{exportCount}</span>
                )}
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
                  <a key={key} href={`#${key}`} className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors cursor-pointer no-underline">
                    <ScoreRing score={score ?? 0} color={color} />
                    <p className="text-xs text-[#A1A1AA] text-center leading-tight">
                      {isRtl ? meta?.labelHe : meta?.label}
                    </p>
                  </a>
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
              <motion.section id={result.analyzer} key={result.analyzer}
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

          {/* ── Export History ──────────────────────────────────────────────── */}
          {exportHistory.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-[#111827]/80 overflow-hidden no-print">
              <div className="flex items-center gap-3 p-5 border-b border-white/10">
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-2">
                  <Bot className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#F9FAFB]">
                    {isRtl ? 'היסטוריית ייצוא לAI' : 'AI Export History'}
                  </h2>
                  <p className="text-xs text-[#A1A1AA]">
                    {isRtl ? `${exportHistory.length} ייצואים` : `${exportHistory.length} exports`}
                  </p>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {exportHistory.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-4">
                    <div className="shrink-0 mt-0.5">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        item.lang === 'he'
                          ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                          : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                      }`}>
                        {item.lang === 'he' ? 'עב׳' : 'EN'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.userContext ? (
                        <p className="text-sm text-[#F9FAFB] truncate">{item.userContext}</p>
                      ) : (
                        <p className="text-sm text-[#64748B] italic">
                          {isRtl ? 'ללא הקשר' : 'No context added'}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-[#64748B] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString(isRtl ? 'he-IL' : 'en-US', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

        </div>
      </main>

      {/* ── Export to AI Modal ─────────────────────────────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !exportLoading && setShowExportModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-violet-400" />
                <h2 className="font-semibold text-[#F9FAFB]">
                  {isRtl ? 'ייצוא לAI' : 'Export to AI'}
                </h2>
              </div>
              <button
                onClick={() => !exportLoading && setShowExportModal(false)}
                className="rounded-lg p-1.5 text-[#A1A1AA] hover:bg-white/10 hover:text-[#F9FAFB] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cost notice */}
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-300">
              <Zap className="h-4 w-4 shrink-0" />
              {isRtl
                ? 'הפרומפט יועתק ללוח — הדביקו ב-ChatGPT או Claude. עלות: 200 קרדיטים'
                : 'The prompt is copied to clipboard — paste it in ChatGPT or Claude. Cost: 200 credits'}
            </div>

            {/* Context textarea */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                {isRtl ? 'ספרו על האתר שלכם (אופציונלי)' : 'Tell us about your website (optional)'}
              </label>
              <textarea
                value={exportUserContext}
                onChange={e => setExportUserContext(e.target.value)}
                placeholder={isRtl
                  ? 'לדוגמה: חנות אונליין למוצרי ספורט, קהל יעד 25-45, מתחרים עיקריים: X ו-Y...'
                  : 'e.g. Online sports store, target audience 25–45, main competitors: X and Y...'
                }
                rows={3}
                disabled={exportLoading}
                className="w-full rounded-xl border border-white/10 bg-[#09090B] px-4 py-3 text-sm text-[#F9FAFB] placeholder:text-[#64748B] focus:border-violet-500 focus:outline-none resize-none disabled:opacity-50"
              />
            </div>

            {/* Language toggle */}
            <div className="mb-5">
              <p className="text-sm font-medium text-[#F9FAFB] mb-2">
                {isRtl ? 'שפת הפרומפט' : 'Prompt language'}
              </p>
              <div className="flex gap-2">
                {(['he', 'en'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setExportLang(l)}
                    disabled={exportLoading}
                    className={`flex-1 rounded-xl border py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                      exportLang === l
                        ? 'border-violet-500/50 bg-violet-500/20 text-violet-300'
                        : 'border-white/10 bg-white/5 text-[#A1A1AA] hover:bg-white/10'
                    }`}
                  >
                    {l === 'he' ? 'עברית' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleExportAction('copy')}
                disabled={exportLoading}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                  exportSuccess === 'copy'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-violet-500/30 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25'
                }`}
              >
                {exportLoading && !exportSuccess
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : exportSuccess === 'copy'
                    ? <Check className="h-4 w-4" />
                    : <Bot className="h-4 w-4" />
                }
                {exportSuccess === 'copy'
                  ? (isRtl ? 'הועתק!' : 'Copied!')
                  : (isRtl ? 'העתק פרומפט' : 'Copy Prompt')
                }
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleExportAction('chatgpt')}
                  disabled={exportLoading}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                    exportSuccess === 'chatgpt'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-[#10A37F]/30 bg-[#10A37F]/10 text-[#10A37F] hover:bg-[#10A37F]/20'
                  }`}
                >
                  {exportLoading && !exportSuccess
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : exportSuccess === 'chatgpt'
                      ? <Check className="h-4 w-4" />
                      : <ExternalLink className="h-4 w-4" />
                  }
                  ChatGPT
                </button>
                <button
                  onClick={() => handleExportAction('claude')}
                  disabled={exportLoading}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                    exportSuccess === 'claude'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-[#D97706]/30 bg-[#D97706]/10 text-[#D97706] hover:bg-[#D97706]/20'
                  }`}
                >
                  {exportLoading && !exportSuccess
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : exportSuccess === 'claude'
                      ? <Check className="h-4 w-4" />
                      : <ExternalLink className="h-4 w-4" />
                  }
                  Claude
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
