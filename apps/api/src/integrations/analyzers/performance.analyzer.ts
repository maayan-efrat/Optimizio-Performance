import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

export class PerformanceAnalyzer extends BaseAnalyzer {
  name = 'performance';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';
    const images = data.fetchedImages || [];
    const headers = data.responseHeaders || {};
    const h = (name: string) => headers[name.toLowerCase()] || '';

    // ── Server response time (TTFB) ───────────────────────────────────────────
    const durationMs = data.fetchDurationMs ?? 0;
    if (durationMs > 3000) {
      issues.push({
        title: `Very slow server — ${(durationMs / 1000).toFixed(1)}s response time`,
        severity: durationMs > 6000 ? 'critical' : 'high',
        description: `Server took ${(durationMs / 1000).toFixed(1)}s to return the HTML.`,
        whyItMatters: 'TTFB over 800ms directly hurts Core Web Vitals and user abandonment.',
        recommendation: 'Enable server caching, use a CDN, optimise database queries, and upgrade hosting.',
        estimatedImpact: '+10-20 points',
        details: `Response: ${durationMs}ms. Good: < 800ms. Poor: > 1800ms.`,
      });
    } else if (durationMs > 800) {
      issues.push({
        title: `High TTFB — ${durationMs}ms`,
        severity: 'medium',
        description: `Server responds in ${durationMs}ms — above the 800ms "good" threshold.`,
        whyItMatters: 'TTFB is the first Core Web Vitals metric in the waterfall.',
        recommendation: 'Add caching headers, CDN for static files, optimise server-side rendering.',
        estimatedImpact: '+5 points',
        details: `Current: ${durationMs}ms. Good: < 800ms. Poor: > 1800ms.`,
      });
    }

    // ── Gzip / Brotli compression ─────────────────────────────────────────────
    const encoding = h('content-encoding').toLowerCase();
    if (!encoding) {
      issues.push({
        title: 'HTTP compression not enabled (no Gzip/Brotli)',
        severity: 'high',
        description: 'The server returns HTML without Content-Encoding compression.',
        whyItMatters: 'Compression reduces HTML transfer size by 60-80%. Most sites save 50-200KB per page.',
        recommendation: 'Enable Gzip or Brotli compression on your web server. For Nginx: gzip on; for Apache: mod_deflate.',
        estimatedImpact: '+8-15 points',
        details: 'No Content-Encoding header found. Typical savings: HTML 75%, CSS 80%, JS 70%.',
      });
    } else if (encoding !== 'br' && encoding !== 'gzip' && encoding !== 'deflate') {
      issues.push({
        title: `Unusual Content-Encoding: "${encoding}"`,
        severity: 'low',
        description: `Server reports Content-Encoding: ${encoding}. Expected gzip or br.`,
        whyItMatters: 'Non-standard encoding may not be supported by all browsers/CDNs.',
        recommendation: 'Switch to Brotli (br) for best compression, or Gzip as a fallback.',
        estimatedImpact: '+2 points',
      });
    }

    // ── Cache-Control headers ─────────────────────────────────────────────────
    const cacheControl = h('cache-control');
    const expires = h('expires');
    const etag = h('etag');
    const lastModified = h('last-modified');
    if (!cacheControl && !expires) {
      issues.push({
        title: 'No cache headers — every visit re-downloads everything',
        severity: 'high',
        description: 'No Cache-Control or Expires header found on the HTML response.',
        whyItMatters: 'Without caching, returning visitors download the full page on every visit, wasting bandwidth.',
        recommendation: 'Add Cache-Control: public, max-age=3600 for static pages. Use Cache-Control: no-cache, must-revalidate for dynamic pages.',
        estimatedImpact: '+5-10 points',
        details: `No Cache-Control, Expires, ETag, or Last-Modified found.`,
      });
    } else if (cacheControl && (cacheControl.includes('no-store') || cacheControl.includes('no-cache'))) {
      if (!etag && !lastModified) {
        issues.push({
          title: 'Cache disabled without revalidation support',
          severity: 'medium',
          description: `Cache-Control: ${cacheControl} — but no ETag or Last-Modified to enable conditional requests.`,
          whyItMatters: 'Without ETags, the browser re-downloads content instead of validating staleness.',
          recommendation: 'Add ETag or Last-Modified headers so browsers can revalidate without downloading.',
          estimatedImpact: '+3 points',
          details: `Cache-Control: ${cacheControl}. Add ETag generation on your server.`,
        });
      }
    } else if (cacheControl) {
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        const maxAge = parseInt(maxAgeMatch[1], 10);
        if (maxAge < 300) {
          issues.push({
            title: `Very short cache TTL — ${maxAge}s`,
            severity: 'low',
            description: `Cache-Control max-age is only ${maxAge} seconds.`,
            whyItMatters: 'Short cache TTL means browsers re-download resources frequently.',
            recommendation: 'Increase max-age to at least 3600 (1 hour) for HTML, 86400+ for static assets.',
            estimatedImpact: '+2-4 points',
            details: `Current: max-age=${maxAge}s. Recommended: ≥3600s for HTML.`,
          });
        }
      }
    }

    // ── HTML document size ────────────────────────────────────────────────────
    const htmlSizeKb = Math.round((data.htmlSizeBytes ?? Buffer.byteLength(html, 'utf8')) / 1024);
    if (htmlSizeKb > 300) {
      issues.push({
        title: `HTML document very large — ${htmlSizeKb}KB`,
        severity: htmlSizeKb > 600 ? 'high' : 'medium',
        description: `HTML document weighs ${htmlSizeKb}KB (threshold: 300KB).`,
        whyItMatters: 'Large HTML delays parsing and first render. Every 100KB adds ~100-200ms on mobile.',
        recommendation: 'Remove unused markup, avoid embedding base64 or large JSON in HTML.',
        estimatedImpact: '+5-10 points',
        details: `${htmlSizeKb}KB. Good: < 100KB.`,
      });
    }

    // ── Broken images ─────────────────────────────────────────────────────────
    const brokenImages = images.filter(img => img.httpStatus !== undefined && img.httpStatus >= 400);
    if (brokenImages.length > 0) {
      issues.push({
        title: `${brokenImages.length} broken image(s) — HTTP ${brokenImages[0].httpStatus}`,
        severity: brokenImages.length > 2 ? 'high' : 'medium',
        description: `${brokenImages.length} images return error status codes (4xx/5xx).`,
        whyItMatters: 'Broken images show placeholder boxes to users and hurt SEO image indexing.',
        recommendation: 'Fix or remove broken image references. Check for typos in file paths.',
        estimatedImpact: '+5 points',
        affectedUrls: brokenImages.map(i => i.src),
        details: `Status codes: ${brokenImages.map(i => `${i.src.split('/').pop()} → ${i.httpStatus}`).join(', ')}`,
      });
    }

    // ── Large images ──────────────────────────────────────────────────────────
    const largeImages = images.filter(img => img.size && img.size > 150_000 && (!img.httpStatus || img.httpStatus < 400));
    for (const img of largeImages.slice(0, 5)) {
      const kb = Math.round(img.size! / 1024);
      issues.push({
        title: `Heavy image — ${kb}KB: ${img.src.split('/').pop()}`,
        severity: kb > 500 ? 'high' : 'medium',
        description: `${img.src.split('/').pop()} is ${kb}KB (threshold: 150KB).`,
        whyItMatters: 'Large images are the #1 cause of slow LCP scores.',
        recommendation: 'Convert to WebP/AVIF, resize to display size, compress at quality 80%.',
        estimatedImpact: '+8-15 points',
        resourceUrl: img.src,
        details: `${kb}KB → WebP estimate: ~${Math.round(kb * 0.4)}KB (60% savings).`,
      });
    }
    if (largeImages.length > 5) {
      issues.push({
        title: `${largeImages.length - 5} more oversized images`,
        severity: 'medium',
        description: `${largeImages.length} total oversized images (showing top 5 above).`,
        whyItMatters: 'Each unoptimised image adds seconds to page load on mobile.',
        recommendation: 'Bulk convert all images to WebP using Squoosh or ImageOptim.',
        estimatedImpact: '+5 points',
        affectedUrls: largeImages.slice(5).map(i => i.src),
      });
    }

    // ── Images missing lazy loading ───────────────────────────────────────────
    const noLazy = images.slice(2).filter(img => !img.hasLazy && (!img.httpStatus || img.httpStatus < 400));
    if (noLazy.length > 0) {
      issues.push({
        title: `${noLazy.length} below-fold image(s) missing lazy loading`,
        severity: 'medium',
        description: `${noLazy.length} non-hero images load eagerly, delaying page render.`,
        whyItMatters: 'Eager-loading off-screen images wastes bandwidth and delays Time to Interactive.',
        recommendation: 'Add loading="lazy" to all images below the first viewport.',
        estimatedImpact: '+4-8 points',
        affectedUrls: noLazy.slice(0, 8).map(i => i.src),
      });
    }

    // ── Images without explicit dimensions (CLS) ──────────────────────────────
    const noDims = images.filter(img => !img.hasExplicitDimensions && (!img.httpStatus || img.httpStatus < 400));
    if (noDims.length > 0) {
      issues.push({
        title: `${noDims.length} image(s) without width/height (CLS risk)`,
        severity: 'medium',
        description: 'Images without explicit dimensions cause layout shifts as they load.',
        whyItMatters: 'CLS directly affects Core Web Vitals score.',
        recommendation: 'Add width and height attributes to every <img> tag.',
        estimatedImpact: '+3-6 points',
        affectedUrls: noDims.slice(0, 8).map(i => i.src),
      });
    }

    // ── Render-blocking JS ────────────────────────────────────────────────────
    const scriptMatches = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/gi)];
    const blockingJs = scriptMatches.filter(m => !m[0].includes('defer') && !m[0].includes('async'));
    if (blockingJs.length > 0) {
      issues.push({
        title: `${blockingJs.length} render-blocking script(s)`,
        severity: blockingJs.length > 2 ? 'high' : 'medium',
        description: `${blockingJs.length} scripts loaded synchronously in <head>.`,
        whyItMatters: 'Synchronous scripts block HTML parsing and delay First Contentful Paint.',
        recommendation: 'Add defer to scripts that run after DOM load, async for analytics.',
        estimatedImpact: '+5-12 points',
        affectedUrls: blockingJs.map(m => m[1]),
        details: `${blockingJs.length} of ${scriptMatches.length} external scripts are render-blocking.`,
      });
    }

    // ── Render-blocking CSS ───────────────────────────────────────────────────
    const allStylesheets = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)];
    const blockingCss = allStylesheets.filter(m => !m[0].includes('media=') || /media=["']all["']/i.test(m[0]));
    if (blockingCss.length > 3) {
      const cssUrls = blockingCss
        .map(m => (m[0].match(/href=["']([^"']+)["']/i) || [])[1])
        .filter(Boolean);
      issues.push({
        title: `${blockingCss.length} render-blocking stylesheet(s)`,
        severity: blockingCss.length > 5 ? 'high' : 'medium',
        description: `${blockingCss.length} CSS files block rendering without media conditions.`,
        whyItMatters: 'CSS is render-blocking — the browser waits for all stylesheets before painting.',
        recommendation: 'Inline critical CSS, load non-critical CSS with media="print" onload trick, or use <link rel="preload" as="style">.',
        estimatedImpact: '+4-8 points',
        affectedUrls: cssUrls.slice(0, 8),
        details: `${blockingCss.length} stylesheets block rendering. Critical CSS should be inlined.`,
      });
    }

    // ── External web fonts ────────────────────────────────────────────────────
    const fontLinks = [...html.matchAll(/<link[^>]+href=["']([^"']*(?:fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|use\.fontawesome\.com)[^"']*)["'][^>]*>/gi)];
    if (fontLinks.length > 1) {
      issues.push({
        title: `${fontLinks.length} external font requests`,
        severity: fontLinks.length > 3 ? 'medium' : 'low',
        description: `${fontLinks.length} external font requests to Google Fonts / Adobe Fonts etc.`,
        whyItMatters: 'Each font request adds a network round-trip and can cause FOUT (flash of unstyled text).',
        recommendation: 'Self-host fonts with font-display: swap, add <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>.',
        estimatedImpact: '+3-6 points',
        affectedUrls: fontLinks.map(m => m[1]),
      });
    }

    // ── Resource hints ────────────────────────────────────────────────────────
    const hasPreconnect = /rel=["']preconnect["']/i.test(html);
    const hasPreload    = /rel=["']preload["']/i.test(html);
    const hasDnsPrefetch = /rel=["']dns-prefetch["']/i.test(html);
    if (!hasPreconnect && !hasDnsPrefetch && fontLinks.length > 0) {
      issues.push({
        title: 'External fonts without preconnect hints',
        severity: 'low',
        description: 'Font CDN requests have no preconnect or dns-prefetch hints.',
        whyItMatters: 'Preconnect eliminates DNS/TLS setup latency for font CDN requests.',
        recommendation: 'Add <link rel="preconnect" href="https://fonts.googleapis.com"> before your font link.',
        estimatedImpact: '+2-4 points',
      });
    }
    if (!hasPreload && scriptMatches.length > 0) {
      issues.push({
        title: 'No critical resource preloading',
        severity: 'low',
        description: 'No <link rel="preload"> hints for critical assets.',
        whyItMatters: 'Preloading critical fonts, images and scripts reduces LCP time significantly.',
        recommendation: 'Add <link rel="preload" as="font"> for the primary font and <link rel="preload" as="image"> for the LCP image.',
        estimatedImpact: '+2-4 points',
      });
    }

    // ── Viewport ──────────────────────────────────────────────────────────────
    if (!/name=["']viewport["']/i.test(html)) {
      issues.push({
        title: 'Missing viewport meta tag',
        severity: 'high',
        description: 'No <meta name="viewport"> — site may not be mobile-responsive.',
        whyItMatters: 'Without viewport meta, mobile browsers zoom out to show desktop layout. Google uses mobile-first indexing.',
        recommendation: 'Add: <meta name="viewport" content="width=device-width, initial-scale=1">',
        estimatedImpact: '+10 points',
      });
    }

    // ── Inline styles ─────────────────────────────────────────────────────────
    const inlineStyleCount = (html.match(/style="[^"]{100,}"/g) || []).length;
    if (inlineStyleCount > 5) {
      issues.push({
        title: `${inlineStyleCount} heavy inline styles`,
        severity: 'low',
        description: 'Many long inline style attributes bloat HTML and prevent CSS caching.',
        whyItMatters: 'Inline styles cannot be cached — they add to HTML size on every request.',
        recommendation: 'Extract repeated styles to an external stylesheet.',
        estimatedImpact: '+2-4 points',
      });
    }

    const totalExternalScripts = scriptMatches.length;
    if (totalExternalScripts > 15) {
      issues.push({
        title: `High script count — ${totalExternalScripts} external JS files`,
        severity: 'medium',
        description: `${totalExternalScripts} separate external JavaScript files loaded.`,
        whyItMatters: 'Each script is a separate HTTP request. Too many scripts cause network congestion.',
        recommendation: 'Bundle and minify JavaScript. Defer analytics/chat widgets.',
        estimatedImpact: '+3-6 points',
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
        compression: encoding || 'none',
        hasCacheControl: !!cacheControl,
        cacheControl: cacheControl || null,
        htmlSizeKb,
        imageCount: images.length,
        brokenImageCount: brokenImages.length,
        largeImageCount: largeImages.length,
        imagesWithLazy: images.filter(i => i.hasLazy).length,
        externalScripts: totalExternalScripts,
        renderBlockingScripts: blockingJs.length,
        renderBlockingCss: blockingCss.length,
        externalFonts: fontLinks.length,
        hasPreconnect,
        hasPreload,
        hasDnsPrefetch,
      },
    };
  }
}
