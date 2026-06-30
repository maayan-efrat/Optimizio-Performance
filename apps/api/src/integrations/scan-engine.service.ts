import { Injectable } from '@nestjs/common';
import { PerformanceAnalyzer } from './analyzers/performance.analyzer';
import { SEOAnalyzer } from './analyzers/seo.analyzer';
import { AccessibilityAnalyzer } from './analyzers/accessibility.analyzer';
import { SecurityAnalyzer } from './analyzers/security.analyzer';
import { JavaScriptCSSAnalyzer } from './analyzers/javascript-css.analyzer';
import { SchemaAnalyzer } from './analyzers/schema.analyzer';
import { MobileAnalyzer } from './analyzers/mobile.analyzer';
import { PrivacyAnalyzer } from './analyzers/privacy.analyzer';
import { LinksAnalyzer } from './analyzers/links.analyzer';
import { BaseAnalyzer, WebsiteData, AnalyzerResult, FetchedImage } from './analyzers/base.analyzer';
import { AIService, RoadmapItem } from './ai/ai.service';
import { PSIService, CWVData } from './psi.service';

const UA = 'Mozilla/5.0 (compatible; Optimizio-Scanner/2.0; +https://optimizio.app)';

// Weights for overall score — links excluded (informational only)
const SCORE_WEIGHTS: Record<string, number> = {
  performance:      0.25,
  seo:              0.25,
  accessibility:    0.20,
  security:         0.15,
  mobile:           0.07,
  privacy:          0.04,
  schema:           0.02,
  'javascript-css': 0.02,
};

export interface FullAuditResult {
  overallScore: number;
  results: AnalyzerResult[];
  aiSummary: string;
  priorityRoadmap: RoadmapItem[];
  cwv: CWVData;
}

@Injectable()
export class ScanEngineService {
  private readonly analyzers: BaseAnalyzer[];
  private readonly aiService: AIService;
  private readonly psiService: PSIService;

  constructor() {
    this.analyzers = [
      new PerformanceAnalyzer(),
      new SEOAnalyzer(),
      new AccessibilityAnalyzer(),
      new SecurityAnalyzer(),
      new JavaScriptCSSAnalyzer(),
      new SchemaAnalyzer(),
      new MobileAnalyzer(),
      new PrivacyAnalyzer(),
      new LinksAnalyzer(),
    ];
    this.aiService = new AIService();
    this.psiService = new PSIService();
  }

  async runFullAudit(
    url: string,
    locale: 'he' | 'en' = 'en',
  ): Promise<FullAuditResult> {
    console.log(`[ScanEngine] Starting audit for ${url}`);

    // Fetch page HTML and call PSI in parallel (PSI takes 3-15s)
    const [{ html, headers }, cwv] = await Promise.all([
      this.fetchPage(url),
      this.psiService.fetch(url),
    ]);
    console.log(`[ScanEngine] Fetched HTML (${html.length} chars) — PSI: ${cwv.psiScore ?? 'n/a'}`);

    const fetchedImages = await this.probeImages(url, html);
    console.log(`[ScanEngine] Probed ${fetchedImages.length} images`);

    const websiteData: WebsiteData = { url, html, responseHeaders: headers, fetchedImages };

    const results = await Promise.all(
      this.analyzers.map(a => a.analyze(websiteData)),
    );

    const overallScore = this.computeWeightedScore(results);

    const aiAnalysis = await this.aiService.analyze(results, url, html, locale);

    console.log(`[ScanEngine] Done — overall score: ${overallScore}`);
    return {
      overallScore,
      results,
      aiSummary: aiAnalysis.summary,
      priorityRoadmap: aiAnalysis.priorityRoadmap ?? [],
      cwv,
    };
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private computeWeightedScore(results: AnalyzerResult[]): number {
    let total = 0;
    let usedWeight = 0;
    for (const r of results) {
      const w = SCORE_WEIGHTS[r.analyzer];
      if (w) { total += r.score * w; usedWeight += w; }
    }
    return usedWeight > 0 ? Math.round(total / usedWeight) : 0;
  }

  private async fetchPage(
    url: string,
  ): Promise<{ html: string; headers: Record<string, string> }> {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15_000);
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const html = await res.text();
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
      return { html, headers };
    } catch (err) {
      console.warn(`[ScanEngine] Failed to fetch ${url}:`, err);
      return { html: '', headers: {} };
    }
  }

  private async probeImages(baseUrl: string, html: string): Promise<FetchedImage[]> {
    const imgTags = [...html.matchAll(/<img([^>]*)>/gi)];
    const images: FetchedImage[] = [];

    for (const [, attrs] of imgTags.slice(0, 12)) {
      const src = (attrs.match(/src="([^"]+)"/i) || attrs.match(/src='([^']+)'/i) || [])[1];
      if (!src || src.startsWith('data:')) continue;

      const altMatch = attrs.match(/alt="([^"]*)"/i) || attrs.match(/alt='([^']*)'/i);
      const hasAlt = altMatch !== null;
      const altText = altMatch?.[1] ?? undefined;
      const hasLazy = /loading="lazy"/i.test(attrs);
      const hasExplicitDimensions =
        /width=["']?\d+["']?/i.test(attrs) && /height=["']?\d+["']?/i.test(attrs);

      let fullSrc = src;
      try { fullSrc = new URL(src, baseUrl).href; } catch {}

      let size: number | undefined;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4_000);
        const headRes = await fetch(fullSrc, {
          method: 'HEAD',
          headers: { 'User-Agent': UA },
          signal: ctrl.signal,
        });
        clearTimeout(t);
        const cl = headRes.headers.get('content-length');
        if (cl) size = parseInt(cl, 10);
      } catch {}

      images.push({ src: fullSrc, size, hasAlt, altText, hasLazy, hasExplicitDimensions });
    }

    return images;
  }
}
