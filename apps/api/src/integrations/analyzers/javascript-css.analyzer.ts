import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

const UA = 'Mozilla/5.0 (compatible; Optimizio-Scanner/2.0)';

interface ResourceInfo {
  url: string;
  sizeBytes: number | null;
  name: string;
  encoding: string | null;
}

const HEAVY_LIBS: { pattern: RegExp; name: string; alternative?: string; estimatedKb: number }[] = [
  { pattern: /moment(\.min)?\.js/,     name: 'Moment.js',   alternative: 'day.js (2KB)', estimatedKb: 232 },
  { pattern: /lodash(\.min)?\.js(?!\-es)/, name: 'Lodash (full bundle)', alternative: 'lodash-es for tree-shaking', estimatedKb: 71 },
  { pattern: /jquery(-\d+\.\d+\.\d+)?(\.min)?\.js/, name: 'jQuery', estimatedKb: 87 },
  { pattern: /font-awesome.*\.js/,     name: 'Font Awesome JS', alternative: 'CSS-only or SVG sprites', estimatedKb: 50 },
  { pattern: /animate\.css/,           name: 'Animate.css', alternative: 'minimal CSS animations', estimatedKb: 78 },
];

export class JavaScriptCSSAnalyzer extends BaseAnalyzer {
  name = 'javascript-css';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';

    const jsUrls = this.extractJS(html, data.url);
    const cssUrls = this.extractCSS(html, data.url);

    const [jsResources, cssResources] = await Promise.all([
      this.probeResources(jsUrls.slice(0, 10)),
      this.probeResources(cssUrls.slice(0, 8)),
    ]);

    // — JS file count
    if (jsUrls.length > 12) {
      issues.push({
        title: `${jsUrls.length} external JavaScript files`,
        severity: 'medium',
        description: `The page loads ${jsUrls.length} separate JS files, increasing HTTP round-trips.`,
        whyItMatters: 'Each script tag is a separate network request, adding latency before the page is usable.',
        recommendation: 'Bundle scripts into 1-2 files or use code splitting with lazy loading.',
        estimatedImpact: '+4-8 points',
        details: `${jsUrls.length} script requests detected. Target: ≤6.`,
      });
    }

    // — CSS file count
    if (cssUrls.length > 5) {
      issues.push({
        title: `${cssUrls.length} external CSS files`,
        severity: 'low',
        description: `${cssUrls.length} stylesheet requests detected.`,
        whyItMatters: 'CSS is render-blocking — multiple stylesheets delay First Contentful Paint.',
        recommendation: 'Merge stylesheets or inline critical CSS; load the rest asynchronously.',
        estimatedImpact: '+3-5 points',
      });
    }

    // — Large JS files + minification heuristic
    for (const r of jsResources) {
      if (r.sizeBytes && r.sizeBytes > 300_000) {
        const kb = Math.round(r.sizeBytes / 1024);
        const isMinified = r.name.includes('.min.');
        const hasCompression = r.encoding === 'gzip' || r.encoding === 'br';
        issues.push({
          title: `Large JS file: ${r.name} (${kb} KB)${!isMinified ? ' — not minified' : ''}`,
          severity: kb > 600 ? 'high' : 'medium',
          description: `${r.url} is ${kb} KB — above the 300 KB recommended budget.${!isMinified ? ' No minification detected.' : ''}`,
          whyItMatters: 'Large JavaScript files delay Time to Interactive and consume mobile data.',
          recommendation: !isMinified
            ? 'Minify this file (remove whitespace/comments), then enable code splitting and tree-shaking.'
            : 'Enable code splitting, tree-shaking, and lazy-import non-critical modules.',
          estimatedImpact: '+5-12 points',
          resourceUrl: r.url,
          details: `${kb} KB. Minified: ${isMinified ? 'yes' : 'no'}. Compressed: ${hasCompression ? r.encoding : 'no'}. Target: < 300 KB.`,
        });
      } else if (r.sizeBytes && r.sizeBytes > 80_000 && !r.name.includes('.min.')) {
        const kb = Math.round(r.sizeBytes / 1024);
        issues.push({
          title: `Unminified JS file: ${r.name} (${kb} KB)`,
          severity: 'low',
          description: `${r.name} appears to be unminified (no .min. in filename) and is ${kb} KB.`,
          whyItMatters: 'Unminified files are 30-50% larger than their minified equivalents, increasing parse time.',
          recommendation: `Run ${r.name} through a minifier (Terser, esbuild). The minified version should be ~${Math.round(kb * 0.6)}KB.`,
          estimatedImpact: '+2-4 points',
          resourceUrl: r.url,
          details: `${kb} KB unminified → estimated ${Math.round(kb * 0.6)} KB minified (40% savings).`,
        });
      }
    }

    // — Large CSS files + minification heuristic
    for (const r of cssResources) {
      if (r.sizeBytes && r.sizeBytes > 100_000) {
        const kb = Math.round(r.sizeBytes / 1024);
        const isMinified = r.name.includes('.min.');
        issues.push({
          title: `Large CSS file: ${r.name} (${kb} KB)${!isMinified ? ' — not minified' : ''}`,
          severity: 'medium',
          description: `${r.url} is ${kb} KB — large stylesheet causing render-blocking delay.${!isMinified ? ' No minification detected.' : ''}`,
          whyItMatters: 'Render-blocking CSS prevents the browser from displaying content until the file loads.',
          recommendation: !isMinified
            ? 'Minify with cssnano or PostCSS, then use PurgeCSS to remove unused selectors.'
            : 'Use PurgeCSS / Tailwind purge to remove unused styles. Extract and inline critical CSS.',
          estimatedImpact: '+3-8 points',
          resourceUrl: r.url,
          details: `${kb} KB. Minified: ${isMinified ? 'yes' : 'no'}. Target: < 50 KB for critical CSS.`,
        });
      } else if (r.sizeBytes && r.sizeBytes > 30_000 && !r.name.includes('.min.')) {
        const kb = Math.round(r.sizeBytes / 1024);
        issues.push({
          title: `Unminified CSS file: ${r.name} (${kb} KB)`,
          severity: 'low',
          description: `${r.name} appears to be unminified and is ${kb} KB.`,
          whyItMatters: 'Unminified CSS slows rendering and wastes bandwidth on mobile.',
          recommendation: `Minify ${r.name} with cssnano or cleancss. Expected saving: ~30%.`,
          estimatedImpact: '+2 points',
          resourceUrl: r.url,
          details: `${kb} KB → estimated ${Math.round(kb * 0.7)} KB minified.`,
        });
      }
    }

    // — JS resources without compression
    const uncompressedJs = jsResources.filter(r => r.sizeBytes && r.sizeBytes > 50_000 && !r.encoding);
    if (uncompressedJs.length > 0) {
      issues.push({
        title: `${uncompressedJs.length} JS file(s) served without compression`,
        severity: 'medium',
        description: `${uncompressedJs.length} JavaScript files are served without Gzip or Brotli compression.`,
        whyItMatters: 'Text-based assets like JS compress by 60-80%. Uncompressed files waste bandwidth.',
        recommendation: 'Enable Gzip or Brotli on your web server for JS/CSS assets.',
        estimatedImpact: '+3-6 points',
        affectedUrls: uncompressedJs.map(r => r.url).slice(0, 8),
        details: `${uncompressedJs.length} of ${jsResources.length} JS files lack Content-Encoding.`,
      });
    }

    // — Heavy libraries
    for (const lib of HEAVY_LIBS) {
      const match = jsUrls.find(u => lib.pattern.test(u));
      if (match) {
        issues.push({
          title: `Heavy library detected: ${lib.name} (~${lib.estimatedKb} KB)`,
          severity: 'medium',
          description: `${lib.name} was found at: ${match}`,
          whyItMatters: `${lib.name} adds significant weight to your JavaScript bundle.`,
          recommendation: lib.alternative
            ? `Replace ${lib.name} with ${lib.alternative} for a major size reduction.`
            : `Audit usage of ${lib.name} — import only what you need.`,
          estimatedImpact: `+${Math.round(lib.estimatedKb * 0.5 / 10)} points`,
          resourceUrl: match,
          details: `Estimated size: ~${lib.estimatedKb} KB.${lib.alternative ? ` Alternative: ${lib.alternative}.` : ''}`,
        });
      }
    }

    const totalJsKb = jsResources.reduce((s, r) => s + (r.sizeBytes ?? 0), 0) / 1024;
    const unminifiedJs  = jsResources.filter(r => r.sizeBytes && r.sizeBytes > 30_000 && !r.name.includes('.min.')).length;
    const unminifiedCss = cssResources.filter(r => r.sizeBytes && r.sizeBytes > 10_000 && !r.name.includes('.min.')).length;

    const metadata: Record<string, unknown> = {
      jsFileCount: jsUrls.length,
      cssFileCount: cssUrls.length,
      totalJsKb: Math.round(totalJsKb),
      unminifiedJs,
      unminifiedCss,
    };

    const score = this.calculateScore(issues);
    return { analyzer: this.name, score, issues, recommendations: [], metadata };
  }

  private extractJS(html: string, base: string): string[] {
    const matches = [...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    return matches
      .map(m => { try { return new URL(m[1], base).href; } catch { return ''; } })
      .filter(Boolean);
  }

  private extractCSS(html: string, base: string): string[] {
    const matches = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi)];
    const matches2 = [...html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["'][^>]*>/gi)];
    return [...matches, ...matches2]
      .map(m => { try { return new URL(m[1], base).href; } catch { return ''; } })
      .filter(Boolean);
  }

  private async probeResources(urls: string[]): Promise<ResourceInfo[]> {
    return Promise.all(urls.map(async url => {
      let sizeBytes: number | null = null;
      let encoding: string | null = null;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3_000);
        const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: ctrl.signal });
        clearTimeout(timer);
        const cl = res.headers.get('content-length');
        if (cl) sizeBytes = parseInt(cl, 10);
        encoding = res.headers.get('content-encoding');
      } catch {}
      return { url, sizeBytes, encoding, name: url.split('/').pop()?.split('?')[0] ?? url };
    }));
  }
}
