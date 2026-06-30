import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

export class PerformanceAnalyzer extends BaseAnalyzer {
  name = 'performance';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';
    const images = data.fetchedImages || [];

    // 1. Large images (actual file sizes from HEAD requests)
    const largeImages = images.filter((img) => img.size && img.size > 150_000);
    for (const img of largeImages) {
      const kb = Math.round((img.size! / 1024));
      issues.push({
        title: `תמונה כבדה — ${kb}KB`,
        severity: kb > 500 ? 'high' : 'medium',
        description: `${img.src.split('/').pop()} is ${kb}KB (threshold: 150KB)`,
        whyItMatters: 'Large images are the #1 cause of slow page loads and poor LCP scores.',
        recommendation: 'Convert to WebP/AVIF, resize to display size, and add loading="lazy".',
        estimatedImpact: '+8-15 points',
        resourceUrl: img.src,
        details: `Actual size: ${kb}KB — target: < 150KB. Savings: ~${Math.round(kb * 0.6)}KB with WebP.`,
      });
    }

    // 2. Images missing lazy loading (below 2nd image)
    const noLazy = images.slice(2).filter((img) => !img.hasLazy);
    if (noLazy.length > 0) {
      issues.push({
        title: `${noLazy.length} image(s) missing lazy loading`,
        severity: 'medium',
        description: `${noLazy.length} below-fold images load eagerly, delaying page render.`,
        whyItMatters: 'Eager-loading off-screen images wastes bandwidth and slows Time to Interactive.',
        recommendation: 'Add loading="lazy" to all images below the fold.',
        estimatedImpact: '+4-8 points',
        resourceUrl: noLazy[0]?.src,
        details: `Affected: ${noLazy.slice(0, 3).map((i) => i.src.split('/').pop()).join(', ')}`,
      });
    }

    // 3. Images missing explicit dimensions (causes CLS)
    const noDims = images.filter((img) => !img.hasExplicitDimensions);
    if (noDims.length > 0) {
      issues.push({
        title: `${noDims.length} image(s) without width/height (CLS risk)`,
        severity: 'medium',
        description: 'Images without explicit dimensions cause layout shifts (CLS) as they load.',
        whyItMatters: 'Cumulative Layout Shift affects Core Web Vitals and user experience.',
        recommendation: 'Add width and height attributes to every <img> tag.',
        estimatedImpact: '+3-6 points',
        resourceUrl: noDims[0]?.src,
        details: `First affected: ${noDims[0]?.src.split('/').pop()}`,
      });
    }

    // 4. Render-blocking scripts (no defer/async)
    const scriptMatches = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/gi)];
    const blocking = scriptMatches.filter(
      (m) => !m[0].includes('defer') && !m[0].includes('async'),
    );
    if (blocking.length > 0) {
      const names = blocking.slice(0, 3).map((m) => m[1].split('/').pop()).join(', ');
      issues.push({
        title: `${blocking.length} render-blocking script(s)`,
        severity: blocking.length > 2 ? 'high' : 'medium',
        description: `Scripts loaded synchronously: ${names}`,
        whyItMatters: 'Synchronous scripts block HTML parsing and delay First Contentful Paint.',
        recommendation: 'Add defer (or async for analytics) to all non-critical scripts.',
        estimatedImpact: '+5-12 points',
        resourceUrl: blocking[0]?.[1],
        details: `${blocking.length} of ${scriptMatches.length} external scripts are render-blocking.`,
      });
    }

    // 5. No viewport meta tag
    if (!html.includes('name="viewport"')) {
      issues.push({
        title: 'Missing viewport meta tag',
        severity: 'high',
        description: 'No <meta name="viewport"> found — site may not be mobile-responsive.',
        whyItMatters: 'Without viewport meta, mobile browsers zoom out and show desktop layout.',
        recommendation: 'Add: <meta name="viewport" content="width=device-width, initial-scale=1">',
        estimatedImpact: '+10 points',
        details: 'Google uses mobile-first indexing — missing viewport hurts both performance and SEO.',
      });
    }

    // 6. Inline styles (performance hint)
    const inlineStyleCount = (html.match(/style="[^"]{100,}"/g) || []).length;
    if (inlineStyleCount > 5) {
      issues.push({
        title: `${inlineStyleCount} heavy inline styles detected`,
        severity: 'low',
        description: 'Many long inline style attributes — consider moving to CSS classes.',
        whyItMatters: 'Inline styles increase HTML size and prevent CSS caching.',
        recommendation: 'Extract repeated styles to an external stylesheet.',
        estimatedImpact: '+2-4 points',
      });
    }

    const score = this.calculateScore(issues);
    return { analyzer: this.name, score, issues, recommendations: [] };
  }
}
