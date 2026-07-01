import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

const UA = 'Mozilla/5.0 (compatible; Optimizio-Scanner/2.0)';

interface ResourceInfo {
  url: string;
  sizeBytes: number | null;
  name: string;
  encoding: string | null;
}

const HEAVY_LIBS: { pattern: RegExp; name: string; alternative?: string; estimatedKb: number }[] = [
  { pattern: /moment(\.min)?\.js/,     name: 'Moment.js',   alternative: 'day.js (2KB) or date-fns', estimatedKb: 232 },
  { pattern: /lodash(\.min)?\.js(?!\-es)/, name: 'Lodash (full bundle)', alternative: 'lodash-es for tree-shaking', estimatedKb: 71 },
  { pattern: /jquery(-\d+\.\d+\.\d+)?(\.min)?\.js/, name: 'jQuery', estimatedKb: 87 },
  { pattern: /font-awesome.*\.js/,     name: 'Font Awesome JS', alternative: 'CSS-only or SVG sprites', estimatedKb: 50 },
  { pattern: /animate\.css/,           name: 'Animate.css', alternative: 'minimal CSS animations', estimatedKb: 78 },
  { pattern: /jquery-migrate(\.min)?\.js/, name: 'jQuery Migrate', alternative: 'Remove and update code to modern jQuery API', estimatedKb: 25 },
  { pattern: /underscore(\.min)?\.js/, name: 'Underscore.js', alternative: 'Modern JS (map/filter/reduce)', estimatedKb: 16 },
  { pattern: /prototype(\.min)?\.js/,  name: 'Prototype.js', alternative: 'Modern JS + fetch()', estimatedKb: 140 },
];

export class JavaScriptCSSAnalyzer extends BaseAnalyzer {
  name = 'javascript-css';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';
    const isDev = data.isDevelopment ?? false;

    const jsUrls = this.extractJS(html, data.url);
    const cssUrls = this.extractCSS(html, data.url);

    const [jsResources, cssResources] = await Promise.all([
      this.probeResources(jsUrls.slice(0, 10)),
      this.probeResources(cssUrls.slice(0, 8)),
    ]);

    // ── Bootstrap version check ───────────────────────────────────────────────
    const bootstrapV3 = jsUrls.find(u => /bootstrap[-v]?3|bootstrap\/3\./i.test(u))
      || (html.includes('bootstrap') && /col-xs-|panel\s+panel-/i.test(html));
    const bootstrapV4 = jsUrls.find(u => /bootstrap[-v]?4|bootstrap\/4\./i.test(u))
      || (html.includes('bootstrap') && /col-sm-\d/.test(html) && !bootstrapV3);
    const bootstrapV5 = jsUrls.find(u => /bootstrap[@/]?5|bootstrap\/5\./i.test(u));

    if (bootstrapV3) {
      issues.push({
        title: 'Bootstrap 3 detected — outdated and unsupported',
        severity: 'high',
        description: 'Bootstrap 3 reached end-of-life in July 2019.',
        whyItMatters: 'Bootstrap 3 has known security vulnerabilities (CVE-2018-14041, CVE-2019-8331) and no longer receives security patches. It also adds unnecessary weight compared to modern alternatives.',
        recommendation: 'Migrate to Bootstrap 5.x. Bootstrap 5 drops jQuery as a dependency, is 20% smaller, and uses modern CSS features.',
        codeExample: '<!-- Bootstrap 5 CDN: -->\n<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">\n<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" defer></script>',
        estimatedImpact: '+5 points',
        difficulty: 'hard',
        fixTime: '1-2 days',
        details: 'Bootstrap 3 EOL: July 2019. Active CVEs: CVE-2018-14041, CVE-2018-14040, CVE-2019-8331.',
      });
    } else if (bootstrapV4) {
      issues.push({
        title: 'Bootstrap 4 detected — consider upgrading to v5',
        severity: 'low',
        description: 'Bootstrap 4 is in LTS (security fixes only) since Jan 2023.',
        whyItMatters: 'Bootstrap 4 still requires jQuery (~87KB) and uses the older grid system. Bootstrap 5 drops jQuery and is more performant.',
        recommendation: 'Upgrade to Bootstrap 5.x to drop the jQuery dependency and access modern components.',
        estimatedImpact: '+2 points',
        difficulty: 'medium',
        fixTime: '2-4 hours',
        details: 'Bootstrap 4 → 5 migration guide: https://getbootstrap.com/docs/5.3/migration/',
      });
    }

    // ── jQuery + React/Vue together ───────────────────────────────────────────
    const hasJquery = jsUrls.some(u => /jquery(\.min)?\.js/i.test(u));
    const hasReact  = jsUrls.some(u => /react(\.production|\.development|\.min)?\.js/i.test(u))
      || html.includes('__NEXT_DATA__')
      || html.includes('data-reactroot');
    const hasVue    = jsUrls.some(u => /vue(\.min|\.esm|\.global)?(\.js|\.prod\.js)?/i.test(u))
      || html.includes('__vue_app__');

    if (hasJquery && (hasReact || hasVue)) {
      const framework = hasReact ? 'React' : 'Vue.js';
      issues.push({
        title: `jQuery and ${framework} loaded together — redundant dependency`,
        severity: 'medium',
        description: `Both jQuery (~87KB) and ${framework} are loaded on this page.`,
        whyItMatters: `${framework} already provides all DOM manipulation, event handling, and AJAX capabilities that jQuery offers. Loading both wastes ~87KB of JavaScript budget and adds unnecessary parse time.`,
        recommendation: `Migrate jQuery-dependent code to native ${framework} patterns and remove jQuery from the project.`,
        codeExample: `// jQuery example:\n$('#button').on('click', () => fetch('/api'));\n\n// ${framework === 'React' ? 'React equivalent:' : 'Vue equivalent:'}\n// Use useEffect hooks / event handlers in your components instead`,
        estimatedImpact: '+4 points',
        difficulty: 'medium',
        fixTime: '2-4 hours',
        details: `jQuery adds ~87KB (29KB gzipped). In a ${framework} app, this is entirely redundant.`,
      });
    }

    // ── React development build in production ─────────────────────────────────
    const hasReactDevBuild = jsUrls.some(u => /react\.development\.js/i.test(u))
      || html.includes('react.development.js')
      || (/react/i.test(html) && html.includes('__DEV__'));
    if (hasReactDevBuild) {
      issues.push({
        title: 'React development build detected in production',
        severity: 'high',
        description: 'The page appears to load the React development build (react.development.js or __DEV__ flag detected).',
        whyItMatters: 'The React development build is 2-3x larger than production (includes warnings, extra error messages, unminified code). It significantly slows parse time and reveals internal implementation details.',
        recommendation: 'Deploy the production React build: set NODE_ENV=production and use react.production.min.js.',
        codeExample: '# Build for production:\nNODE_ENV=production npm run build\n\n# Or in webpack:\nmode: "production" // automatically sets NODE_ENV=production',
        estimatedImpact: '+8 points',
        difficulty: 'easy',
        fixTime: '30 דקות',
        details: 'react.development.js is ~7x larger than react.production.min.js (6.3KB vs 45KB).',
      });
    }

    // ── JS file count (dev bundles split by design — skip in dev) ────────────
    if (!isDev && jsUrls.length > 12) {
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

    // ── CSS file count ────────────────────────────────────────────────────────
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

    // ── Large JS files + minification heuristic (skip in dev — build files are intentionally unminified) ──
    if (!isDev) {
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

      // ── Large CSS files + minification heuristic ────────────────────────────
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

      // ── JS resources without compression ────────────────────────────────────
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
    }

    // ── Heavy libraries ───────────────────────────────────────────────────────
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
      hasJquery,
      hasReact,
      hasVue,
      hasReactDevBuild,
      bootstrapVersion: bootstrapV3 ? 3 : bootstrapV4 ? 4 : bootstrapV5 ? 5 : null,
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
