import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

const UA = 'Mozilla/5.0 (compatible; Optimizio-Scanner/2.0)';

interface ResourceInfo {
  url: string;
  sizeBytes: number | null;
  name: string;
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

    // — Large JS files
    for (const r of jsResources) {
      if (r.sizeBytes && r.sizeBytes > 300_000) {
        const kb = Math.round(r.sizeBytes / 1024);
        issues.push({
          title: `Large JS file: ${r.name} (${kb} KB)`,
          severity: kb > 600 ? 'high' : 'medium',
          description: `${r.url} is ${kb} KB — well above the 300 KB recommended budget.`,
          whyItMatters: 'Large JavaScript files delay Time to Interactive and consume mobile data.',
          recommendation: 'Enable code splitting, tree-shaking, and minification. Consider lazy-importing non-critical modules.',
          estimatedImpact: '+5-12 points',
          resourceUrl: r.url,
          details: `Size: ${kb} KB. Target: < 300 KB per script.`,
        });
      }
    }

    // — Large CSS files
    for (const r of cssResources) {
      if (r.sizeBytes && r.sizeBytes > 100_000) {
        const kb = Math.round(r.sizeBytes / 1024);
        issues.push({
          title: `Large CSS file: ${r.name} (${kb} KB)`,
          severity: 'medium',
          description: `${r.url} is ${kb} KB — large stylesheet causing render-blocking delay.`,
          whyItMatters: 'Render-blocking CSS prevents the browser from displaying content until the file loads.',
          recommendation: 'Use PurgeCSS / Tailwind purge to remove unused styles. Extract and inline critical CSS.',
          estimatedImpact: '+3-8 points',
          resourceUrl: r.url,
        });
      }
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
    const metadata: Record<string, unknown> = {
      jsFileCount: jsUrls.length,
      cssFileCount: cssUrls.length,
      totalJsKb: Math.round(totalJsKb),
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
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3_000);
        const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: ctrl.signal });
        clearTimeout(timer);
        const cl = res.headers.get('content-length');
        if (cl) sizeBytes = parseInt(cl, 10);
      } catch {}
      return { url, sizeBytes, name: url.split('/').pop()?.split('?')[0] ?? url };
    }));
  }
}
