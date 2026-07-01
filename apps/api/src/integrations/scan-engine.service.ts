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
import { BaseAnalyzer, WebsiteData, AnalyzerResult, FetchedImage, TechStack } from './analyzers/base.analyzer';
import { AIService, RoadmapItem } from './ai/ai.service';
import { PSIService, CWVData } from './psi.service';

const UA = 'Mozilla/5.0 (compatible; Optimizio-Scanner/2.0; +https://optimizio.app)';

function isDevelopmentUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    if (hostname === 'localhost') return true;
    if (/^127\./.test(hostname)) return true;
    if (/^192\.168\./.test(hostname)) return true;
    if (/^10\./.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
    if (hostname.endsWith('.local') || hostname.endsWith('.test') || hostname.endsWith('.internal')) return true;
    if (hostname.includes('ngrok') || hostname.includes('localhost.run')) return true;
    // Vercel/Netlify preview (not canonical www. domain)
    if (/\.vercel\.app$/.test(hostname) && !hostname.startsWith('www.')) return true;
    if (/\.netlify\.app$/.test(hostname) && !hostname.startsWith('www.')) return true;
    return false;
  } catch { return false; }
}

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

  // Lightweight score-only audit — no AI, no PSI, no image probing
  async runQuickScore(url: string): Promise<{ url: string; scores: Record<string, number>; overall: number }> {
    const { html, headers, durationMs, sizeBytes } = await this.fetchPage(url);
    const websiteData: WebsiteData = { url, html, responseHeaders: headers, fetchDurationMs: durationMs, htmlSizeBytes: sizeBytes };
    const results = await Promise.all(this.analyzers.map(a => a.analyze(websiteData)));
    const overall = this.computeWeightedScore(results);
    const scores: Record<string, number> = {};
    for (const r of results) scores[r.analyzer] = r.score;
    return { url, scores, overall };
  }

  async runFullAudit(
    url: string,
    locale: 'he' | 'en' = 'en',
  ): Promise<FullAuditResult> {
    console.log(`[ScanEngine] Starting audit for ${url}`);

    // Fetch page HTML and call PSI in parallel (PSI takes 3-15s)
    const [{ html, headers, durationMs, sizeBytes }, cwv] = await Promise.all([
      this.fetchPage(url),
      this.psiService.fetch(url),
    ]);
    console.log(`[ScanEngine] Fetched HTML (${html.length} chars, ${durationMs}ms) — PSI: ${cwv.psiScore ?? 'n/a'}`);

    const fetchedImages = await this.probeImages(url, html);
    console.log(`[ScanEngine] Probed ${fetchedImages.length} images`);

    // Probe robots.txt, sitemap.xml, HTTPS redirect, and custom 404 in parallel
    const origin = new URL(url).origin;
    const isDevelopment = isDevelopmentUrl(url);

    const [hasSitemap, hasRobotsTxt, httpRedirectsToHttps, hasCustom404, exposedPaths] = await Promise.all([
      this.probeExists(`${origin}/sitemap.xml`),
      this.probeExists(`${origin}/robots.txt`),
      this.checkHttpsRedirect(url),
      this.probe404(origin),
      isDevelopment ? Promise.resolve([]) : this.probeSensitivePaths(origin),
    ]);

    const techStack = this.detectTechStack(html, headers);

    const websiteData: WebsiteData = {
      url, html, responseHeaders: headers, fetchedImages,
      fetchDurationMs: durationMs, htmlSizeBytes: sizeBytes,
      hasSitemap, hasRobotsTxt, httpRedirectsToHttps,
      hasCustom404, techStack, isDevelopment, exposedPaths,
    };

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
  ): Promise<{ html: string; headers: Record<string, string>; durationMs: number; sizeBytes: number }> {
    const t0 = Date.now();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15_000);
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const html = await res.text();
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
      return { html, headers, durationMs: Date.now() - t0, sizeBytes: Buffer.byteLength(html, 'utf8') };
    } catch (err) {
      console.warn(`[ScanEngine] Failed to fetch ${url}:`, err);
      return { html: '', headers: {}, durationMs: Date.now() - t0, sizeBytes: 0 };
    }
  }

  private async checkHttpsRedirect(url: string): Promise<boolean> {
    if (!url.startsWith('https://')) return false; // already HTTP, not relevant
    try {
      const httpUrl = url.replace(/^https:\/\//, 'http://');
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6_000);
      const res = await fetch(httpUrl, {
        headers: { 'User-Agent': UA },
        signal: ctrl.signal,
        redirect: 'follow',
      });
      clearTimeout(t);
      return res.url.startsWith('https://');
    } catch {
      return false;
    }
  }

  private async probeExists(url: string): Promise<boolean> {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5_000);
      const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: ctrl.signal });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  }

  private async probeSensitivePaths(origin: string): Promise<string[]> {
    const PATHS = [
      '/.env', '/.env.local', '/.env.production', '/.env.development',
      '/.git/config', '/.git/HEAD',
      '/backup.zip', '/backup.sql', '/database.sql', '/db.sql', '/dump.sql',
      '/phpinfo.php', '/info.php',
      '/wp-config.php', '/config.php', '/config.json', '/config.yml',
      '/.DS_Store', '/.svn/entries',
      '/web.config', '/crossdomain.xml',
      '/server-status', '/server-info',
      '/admin.php', '/install.php', '/setup.php',
    ];
    const exposed: string[] = [];
    await Promise.allSettled(PATHS.map(async path => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3_000);
        const res = await fetch(`${origin}${path}`, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: ctrl.signal });
        clearTimeout(t);
        if (res.ok) exposed.push(path);
      } catch {}
    }));
    return exposed;
  }

  private async probe404(origin: string): Promise<boolean> {
    try {
      const path = `/optimizio-404-check-${Date.now()}`;
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10_000);
      const res = await fetch(`${origin}${path}`, {
        headers: { 'User-Agent': UA },
        signal: ctrl.signal,
        redirect: 'follow',
      });
      clearTimeout(t);
      if (res.status === 404) return true;
      if (res.status === 200) {
        const text = await res.text();
        // Hebrew: "הדף לא נמצא", "עמוד לא נמצא"; English: "not found", "page not found"
        return /404|not found|page not found|הדף לא נמצא|עמוד לא נמצא/i.test(text.slice(0, 4000));
      }
      return false;
    } catch {
      return false;
    }
  }

  private detectTechStack(html: string, headers: Record<string, string>): TechStack {
    const tags: string[] = [];
    let cms: string | null = null;
    let framework: string | null = null;

    // meta generator (most reliable)
    const genMatch = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']generator["']/i);
    const gen = (genMatch?.[1] ?? '').toLowerCase();

    if (gen.includes('wordpress')) { cms = 'WordPress'; tags.push('WordPress'); }
    else if (gen.includes('squarespace')) { cms = 'Squarespace'; tags.push('Squarespace'); }
    else if (gen.includes('wix')) { cms = 'Wix'; tags.push('Wix'); }
    else if (gen.includes('webflow')) { cms = 'Webflow'; tags.push('Webflow'); }
    else if (gen.includes('shopify')) { cms = 'Shopify'; tags.push('Shopify'); }
    else if (gen.includes('joomla')) { cms = 'Joomla'; tags.push('Joomla'); }
    else if (gen.includes('drupal')) { cms = 'Drupal'; tags.push('Drupal'); }
    else if (gen.includes('ghost')) { cms = 'Ghost'; tags.push('Ghost'); }

    // heuristic fallbacks
    if (!cms) {
      if (html.includes('wp-content/') || html.includes('wp-includes/')) { cms = 'WordPress'; tags.push('WordPress'); }
      else if (html.includes('static.wixstatic.com') || html.includes('wix-code')) { cms = 'Wix'; tags.push('Wix'); }
      else if (html.includes('squarespace-cdn.com')) { cms = 'Squarespace'; tags.push('Squarespace'); }
      else if (html.includes('cdn.shopify.com') || html.includes('myshopify.com')) { cms = 'Shopify'; tags.push('Shopify'); }
      else if (html.includes('uploads-ssl.webflow.com')) { cms = 'Webflow'; tags.push('Webflow'); }
      else if (/\/sites\/default\/files\//i.test(html)) { cms = 'Drupal'; tags.push('Drupal'); }
      else if (/\/components\/com_/i.test(html)) { cms = 'Joomla'; tags.push('Joomla'); }
    }

    // WordPress plugins
    if (cms === 'WordPress') {
      if (html.includes('elementor-')) tags.push('Elementor');
      if (/divi-/i.test(html)) tags.push('Divi');
      if (/woocommerce/i.test(html)) tags.push('WooCommerce');
      if (/yoast/i.test(html)) tags.push('Yoast SEO');
    }

    // JS frameworks
    if (html.includes('__NEXT_DATA__') || html.includes('/_next/static/')) {
      framework = 'Next.js'; tags.push('Next.js');
    } else if (html.includes('__NUXT__') || html.includes('/_nuxt/')) {
      framework = 'Nuxt.js'; tags.push('Nuxt.js');
    } else if (/data-reactroot|data-react-helmet/i.test(html)) {
      framework = 'React'; tags.push('React');
    } else if (html.includes('__vue_app__') || /\bVue\.js\b/.test(html)) {
      framework = 'Vue.js'; tags.push('Vue.js');
    } else if (/ng-version|ng-app/i.test(html)) {
      framework = 'Angular'; tags.push('Angular');
    }

    // CSS frameworks
    if (html.includes('bootstrap.min.css') || html.includes('bootstrap.bundle')) tags.push('Bootstrap');
    if (/class="[^"]*(?:flex |grid |px-\d|py-\d|text-\w+-\d|rounded-|border-\w)[^"]*"/i.test(html)) tags.push('Tailwind CSS');

    // Hosting / CDN from headers
    const server = (headers['server'] ?? '').toLowerCase();
    if (server.includes('cloudflare')) tags.push('Cloudflare');
    else if (server.includes('vercel')) tags.push('Vercel');
    else if (server.includes('nginx')) tags.push('Nginx');
    else if (server.includes('apache')) tags.push('Apache');
    const via = (headers['via'] ?? '').toLowerCase();
    if (via.includes('cloudfront')) tags.push('AWS CloudFront');

    return { cms, framework, tags: [...new Set(tags)] };
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
      let httpStatus: number | undefined;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4_000);
        const headRes = await fetch(fullSrc, {
          method: 'HEAD',
          headers: { 'User-Agent': UA },
          signal: ctrl.signal,
        });
        clearTimeout(t);
        httpStatus = headRes.status;
        const cl = headRes.headers.get('content-length');
        if (cl) size = parseInt(cl, 10);
      } catch {}

      images.push({ src: fullSrc, size, httpStatus, hasAlt, altText, hasLazy, hasExplicitDimensions });
    }

    return images;
  }
}
