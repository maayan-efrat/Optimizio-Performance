import { Injectable } from '@nestjs/common';
import { PerformanceAnalyzer } from './analyzers/performance.analyzer';
import { SEOAnalyzer } from './analyzers/seo.analyzer';
import { AccessibilityAnalyzer } from './analyzers/accessibility.analyzer';
import { SecurityAnalyzer } from './analyzers/security.analyzer';
import { BaseAnalyzer, WebsiteData, AnalyzerResult, FetchedImage } from './analyzers/base.analyzer';
import { AIService, RoadmapItem } from './ai/ai.service';

const UA = 'Mozilla/5.0 (compatible; Optimizio-Scanner/2.0; +https://optimizio.app)';

@Injectable()
export class ScanEngineService {
  private analyzers: BaseAnalyzer[];
  private aiService: AIService;

  constructor() {
    this.analyzers = [
      new PerformanceAnalyzer(),
      new SEOAnalyzer(),
      new AccessibilityAnalyzer(),
      new SecurityAnalyzer(),
    ];
    this.aiService = new AIService();
  }

  async runFullAudit(
    url: string,
    locale: 'he' | 'en' = 'en',
  ): Promise<{
    overallScore: number;
    results: AnalyzerResult[];
    aiSummary: string;
    priorityRoadmap: RoadmapItem[];
  }> {
    console.log(`[ScanEngine] Starting audit for ${url}`);

    // Step 1 — fetch page
    const { html, headers } = await this.fetchPage(url);
    console.log(`[ScanEngine] Fetched HTML — ${html.length} chars`);

    // Step 2 — collect and size images
    const fetchedImages = await this.probeImages(url, html);
    console.log(`[ScanEngine] Probed ${fetchedImages.length} images`);

    const websiteData: WebsiteData = { url, html, responseHeaders: headers, fetchedImages };

    // Step 3 — run all analyzers in parallel
    const results = await Promise.all(
      this.analyzers.map((a) => a.analyze(websiteData)),
    );

    const overallScore = Math.round(
      results.reduce((sum, r) => sum + r.score, 0) / results.length,
    );

    // Step 4 — AI analysis
    const aiAnalysis = await this.aiService.analyze(results, url, html, locale);

    return {
      overallScore,
      results,
      aiSummary: aiAnalysis.summary,
      priorityRoadmap: aiAnalysis.priorityRoadmap || [],
    };
  }

  // ── helpers ──────────────────────────────────────────────────────────────

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
    // Extract all img tags
    const imgTags = [...html.matchAll(/<img([^>]*)>/gi)];
    const images: FetchedImage[] = [];

    for (const [, attrs] of imgTags.slice(0, 12)) {
      const src = (attrs.match(/src="([^"]+)"/i) || attrs.match(/src='([^']+)'/i) || [])[1];
      if (!src || src.startsWith('data:')) continue;

      const altMatch = attrs.match(/alt="([^"]*)"/i) || attrs.match(/alt='([^']*)'/i);
      const hasAlt = altMatch !== null;
      const altText = altMatch?.[1] ?? undefined;
      const hasLazy = /loading="lazy"/i.test(attrs);
      const hasExplicitDimensions = /width=["']?\d+["']?/i.test(attrs) && /height=["']?\d+["']?/i.test(attrs);

      let fullSrc = src;
      try { fullSrc = new URL(src, baseUrl).href; } catch {}

      // HEAD request for file size
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
