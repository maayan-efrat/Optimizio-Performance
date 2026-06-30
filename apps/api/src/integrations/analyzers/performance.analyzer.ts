import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

export class PerformanceAnalyzer extends BaseAnalyzer {
  name = 'performance';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';
    const images = data.fetchedImages || [];

    // ── Page load time ────────────────────────────────────────────────────────
    const durationMs = data.fetchDurationMs ?? 0;
    if (durationMs > 3000) {
      issues.push({
        title: `Slow server response — ${(durationMs / 1000).toFixed(1)}s to fetch HTML`,
        severity: durationMs > 6000 ? 'critical' : 'high',
        description: `The server took ${(durationMs / 1000).toFixed(1)} seconds to return the HTML document.`,
        whyItMatters: 'TTFB over 800ms directly hurts Core Web Vitals and user experience. Users abandon slow sites.',
        recommendation: 'Enable server-side caching, use a CDN, optimise database queries, and consider upgrading your hosting.',
        estimatedImpact: '+10-20 points',
        details: `Response time: ${durationMs}ms. Target: < 800ms TTFB.`,
      });
    } else if (durationMs > 800) {
      issues.push({
        title: `High TTFB — ${durationMs}ms server response time`,
        severity: 'medium',
        description: `Server responds in ${durationMs}ms — above the 800ms good threshold.`,
        whyItMatters: 'TTFB is the first metric in the Google Core Web Vitals waterfall.',
        recommendation: 'Add caching headers, use a CDN for static files, and optimise server-side rendering.',
        estimatedImpact: '+5 points',
        details: `Current: ${durationMs}ms. Good: < 800ms. Poor: > 1800ms.`,
      });
    }

    // ── HTML document size ────────────────────────────────────────────────────
    const htmlSizeKb = Math.round((data.htmlSizeBytes ?? Buffer.byteLength(html, 'utf8')) / 1024);
    if (htmlSizeKb > 300) {
      issues.push({
        title: `HTML document is very large — ${htmlSizeKb}KB`,
        severity: htmlSizeKb > 600 ? 'high' : 'medium',
        description: `The HTML document weighs ${htmlSizeKb}KB (threshold: 300KB).`,
        whyItMatters: 'Large HTML delays parsing and blocks rendering. Every extra 100KB adds ~100-200ms on mobile.',
        recommendation: 'Remove unused markup, inline base64 images, or embedded JSON. Server-side render only critical HTML.',
        estimatedImpact: '+5-10 points',
        details: `Page size: ${htmlSizeKb}KB. Good: < 100KB. Acceptable: < 200KB.`,
      });
    }

    // ── Large images ──────────────────────────────────────────────────────────
    const largeImages = images.filter((img) => img.size && img.size > 150_000);
    for (const img of largeImages.slice(0, 5)) {
      const kb = Math.round(img.size! / 1024);
      issues.push({
        title: `Heavy image — ${kb}KB: ${img.src.split('/').pop()}`,
        severity: kb > 500 ? 'high' : 'medium',
        description: `${img.src.split('/').pop()} is ${kb}KB (threshold: 150KB).`,
        whyItMatters: 'Large images are the #1 cause of slow page loads and poor LCP scores.',
        recommendation: 'Convert to WebP/AVIF, resize to display size, compress with quality 80%, and add loading="lazy".',
        estimatedImpact: '+8-15 points',
        resourceUrl: img.src,
        details: `File: ${kb}KB — target: < 150KB. WebP estimate: ~${Math.round(kb * 0.4)}KB (60% savings).`,
      });
    }
    if (largeImages.length > 5) {
      issues.push({
        title: `${largeImages.length - 5} additional oversized images`,
        severity: 'medium',
        description: `${largeImages.length} total oversized images found (showing top 5 above).`,
        whyItMatters: 'Each unoptimised image adds seconds to page load on mobile.',
        recommendation: 'Run all site images through a bulk WebP converter (Squoosh, ImageOptim).',
        estimatedImpact: '+5 points',
        affectedUrls: largeImages.slice(5).map(i => i.src),
      });
    }

    // ── Images missing lazy loading ───────────────────────────────────────────
    const noLazy = images.slice(2).filter((img) => !img.hasLazy);
    if (noLazy.length > 0) {
      issues.push({
        title: `${noLazy.length} below-fold image(s) missing lazy loading`,
        severity: 'medium',
        description: `${noLazy.length} non-hero images load eagerly, delaying page render.`,
        whyItMatters: 'Eager-loading off-screen images wastes bandwidth and delays Time to Interactive.',
        recommendation: 'Add loading="lazy" to all images below the first viewport.',
        estimatedImpact: '+4-8 points',
        affectedUrls: noLazy.slice(0, 8).map(i => i.src),
        details: `Affected: ${noLazy.slice(0, 3).map(i => i.src.split('/').pop()).join(', ')}`,
      });
    }

    // ── Images without explicit dimensions (CLS) ──────────────────────────────
    const noDims = images.filter((img) => !img.hasExplicitDimensions);
    if (noDims.length > 0) {
      issues.push({
        title: `${noDims.length} image(s) without width/height (CLS risk)`,
        severity: 'medium',
        description: 'Images without explicit dimensions cause layout shifts (CLS) as they load.',
        whyItMatters: 'Cumulative Layout Shift directly affects Core Web Vitals and user experience.',
        recommendation: 'Add width and height attributes to every <img> tag to reserve space before load.',
        estimatedImpact: '+3-6 points',
        affectedUrls: noDims.slice(0, 8).map(i => i.src),
        details: `First affected: ${noDims[0]?.src.split('/').pop()}`,
      });
    }

    // ── Render-blocking scripts ───────────────────────────────────────────────
    const scriptMatches = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/gi)];
    const blocking = scriptMatches.filter(m => !m[0].includes('defer') && !m[0].includes('async'));
    if (blocking.length > 0) {
      const names = blocking.slice(0, 3).map(m => m[1].split('/').pop()).join(', ');
      issues.push({
        title: `${blocking.length} render-blocking script(s)`,
        severity: blocking.length > 2 ? 'high' : 'medium',
        description: `${blocking.length} scripts are loaded synchronously in <head>: ${names}`,
        whyItMatters: 'Synchronous scripts block HTML parsing and delay First Contentful Paint.',
        recommendation: 'Add defer to scripts that run after DOM load, or async for analytics.',
        estimatedImpact: '+5-12 points',
        resourceUrl: blocking[0]?.[1],
        affectedUrls: blocking.map(m => m[1]),
        details: `${blocking.length} of ${scriptMatches.length} external scripts are render-blocking.`,
      });
    }

    // ── External web fonts ────────────────────────────────────────────────────
    const fontLinks = [...html.matchAll(/<link[^>]+href="([^"]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|use\.fontawesome\.com)[^"]*)"[^>]*>/gi)];
    const fontFaceCount = (html.match(/@font-face/g) || []).length;
    const totalFonts = fontLinks.length + (fontFaceCount > 0 ? 1 : 0);
    if (fontLinks.length > 1) {
      issues.push({
        title: `${fontLinks.length} external font requests`,
        severity: fontLinks.length > 3 ? 'medium' : 'low',
        description: `${fontLinks.length} external font stylesheets loaded (Google Fonts, Adobe Fonts, etc.).`,
        whyItMatters: 'Each external font request adds a network round-trip and can cause FOUT (flash of unstyled text).',
        recommendation: 'Self-host fonts, use font-display: swap, and preconnect to font CDN with <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>.',
        estimatedImpact: '+3-6 points',
        affectedUrls: fontLinks.map(m => m[1]),
        details: `Font requests: ${fontLinks.map(m => m[1].split('?')[0].split('/').pop()).join(', ')}`,
      });
    }

    // ── Resource hints (preconnect / prefetch / preload) ──────────────────────
    const hasPreconnect = html.includes('rel="preconnect"') || html.includes("rel='preconnect'");
    const hasPreload    = html.includes('rel="preload"')    || html.includes("rel='preload'");
    const hasDnsPrefetch = html.includes('rel="dns-prefetch"') || html.includes("rel='dns-prefetch'");
    if (!hasPreconnect && !hasDnsPrefetch) {
      issues.push({
        title: 'No preconnect or dns-prefetch hints',
        severity: 'low',
        description: 'Page uses external resources but has no preconnect/dns-prefetch hints.',
        whyItMatters: 'Resource hints eliminate connection setup latency for third-party domains.',
        recommendation: 'Add <link rel="preconnect" href="https://fonts.googleapis.com"> for each critical external domain.',
        estimatedImpact: '+2-4 points',
      });
    }
    if (!hasPreload && scriptMatches.length > 0) {
      issues.push({
        title: 'No critical resource preloading',
        severity: 'low',
        description: 'No <link rel="preload"> hints detected for critical assets.',
        whyItMatters: 'Preloading critical fonts, images, and scripts reduces LCP time.',
        recommendation: 'Add <link rel="preload" as="font"> for the primary web font and <link rel="preload" as="image"> for the LCP image.',
        estimatedImpact: '+2-4 points',
      });
    }

    // ── Viewport meta ─────────────────────────────────────────────────────────
    if (!html.includes('name="viewport"') && !html.includes("name='viewport'")) {
      issues.push({
        title: 'Missing viewport meta tag',
        severity: 'high',
        description: 'No <meta name="viewport"> found — site may not be mobile-responsive.',
        whyItMatters: 'Without viewport meta, mobile browsers zoom out to show desktop layout. Google uses mobile-first indexing.',
        recommendation: 'Add: <meta name="viewport" content="width=device-width, initial-scale=1">',
        estimatedImpact: '+10 points',
      });
    }

    // ── Heavy inline styles ───────────────────────────────────────────────────
    const inlineStyleCount = (html.match(/style="[^"]{100,}"/g) || []).length;
    if (inlineStyleCount > 5) {
      issues.push({
        title: `${inlineStyleCount} heavy inline styles detected`,
        severity: 'low',
        description: 'Many long inline style attributes increase HTML size and prevent CSS caching.',
        whyItMatters: 'Inline styles bloat HTML and cannot be cached separately by the browser.',
        recommendation: 'Extract repeated styles to an external stylesheet.',
        estimatedImpact: '+2-4 points',
        details: `Found ${inlineStyleCount} inline style attributes over 100 characters.`,
      });
    }

    // ── Total script count ────────────────────────────────────────────────────
    const totalExternalScripts = scriptMatches.length;
    const inlineScripts = (html.match(/<script(?![^>]+src)[^>]*>[\s\S]*?<\/script>/gi) || []).length;
    if (totalExternalScripts > 15) {
      issues.push({
        title: `High script count — ${totalExternalScripts} external JS files`,
        severity: 'medium',
        description: `${totalExternalScripts} separate external JavaScript files are loaded.`,
        whyItMatters: 'Each script requires a separate HTTP request. Too many scripts cause network congestion.',
        recommendation: 'Bundle and minify JavaScript. Defer loading of analytics/chat widgets.',
        estimatedImpact: '+3-6 points',
        details: `External scripts: ${totalExternalScripts}, Inline scripts: ${inlineScripts}`,
      });
    }

    const score = this.calculateScore(issues);
    return {
      analyzer: this.name,
      score,
      issues,
      recommendations: [],
      metadata: {
        fetchDurationMs: durationMs || null,
        htmlSizeKb,
        imageCount: images.length,
        largeImageCount: largeImages.length,
        imagesWithLazy: images.filter(i => i.hasLazy).length,
        imagesWithDimensions: images.filter(i => i.hasExplicitDimensions).length,
        externalScripts: totalExternalScripts,
        inlineScripts,
        renderBlockingScripts: blocking.length,
        externalFonts: totalFonts,
        hasPreconnect,
        hasPreload,
        hasDnsPrefetch,
      },
    };
  }
}
