import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

export class SEOAnalyzer extends BaseAnalyzer {
  name = 'seo';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';

    // ── Title tag ────────────────────────────────────────────────────────────
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || '';
    if (!title) {
      issues.push({
        title: 'Missing <title> tag',
        severity: 'critical',
        description: 'No <title> tag found in the page.',
        whyItMatters: 'The title tag is the most important on-page SEO element. Google shows it as the clickable headline in search results.',
        recommendation: 'Add a unique, descriptive <title> (50-60 characters) to every page.',
        estimatedImpact: '+15 points',
        details: 'Google shows the title in search results — missing it severely hurts CTR.',
      });
    } else if (title.length < 20) {
      issues.push({
        title: `Title too short (${title.length} chars): "${title}"`,
        severity: 'medium',
        description: 'Page title is under 20 characters — too brief to describe the page content.',
        whyItMatters: 'Short titles miss keyword opportunities and look weak in search results.',
        recommendation: 'Expand the title to 50-60 characters with the main keyword.',
        estimatedImpact: '+5 points',
        details: `Current: "${title}" (${title.length} chars). Target: 50-60 chars.`,
      });
    } else if (title.length > 65) {
      issues.push({
        title: `Title too long (${title.length} chars): "${title.slice(0, 50)}..."`,
        severity: 'low',
        description: 'Title exceeds 65 characters and will be cut off in Google search results.',
        whyItMatters: 'Truncated titles reduce click-through rates.',
        recommendation: 'Shorten the title to 50-60 characters while keeping the main keyword.',
        estimatedImpact: '+2 points',
        details: `Current: "${title}" — ${title.length} chars. Google shows ~60 chars.`,
      });
    }

    // ── Meta description ─────────────────────────────────────────────────────
    const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    const metaDesc = metaDescMatch?.[1]?.trim() || '';
    if (!metaDesc) {
      issues.push({
        title: 'Missing meta description',
        severity: 'high',
        description: 'No <meta name="description"> found.',
        whyItMatters: 'Google shows the meta description in search snippets — it directly affects CTR.',
        recommendation: 'Add a unique meta description between 120-160 characters for every page.',
        estimatedImpact: '+8 points',
        details: 'Without a description, Google picks random text from the page, often poorly.',
      });
    } else if (metaDesc.length < 60) {
      issues.push({
        title: `Meta description too short (${metaDesc.length} chars)`,
        severity: 'medium',
        description: `Current: "${metaDesc}"`,
        whyItMatters: "Short descriptions don't persuade users to click from search results.",
        recommendation: 'Expand to 120-160 characters with a clear value proposition.',
        estimatedImpact: '+4 points',
        details: `Current length: ${metaDesc.length} chars. Target: 120-160 chars.`,
      });
    } else if (metaDesc.length > 165) {
      issues.push({
        title: `Meta description too long (${metaDesc.length} chars)`,
        severity: 'low',
        description: 'Description will be truncated in search results.',
        whyItMatters: 'Truncated descriptions look unprofessional in SERPs.',
        recommendation: 'Shorten to 120-160 characters.',
        estimatedImpact: '+2 points',
        details: `Current: "${metaDesc.slice(0, 80)}..." (${metaDesc.length} chars)`,
      });
    }

    // ── H1 tags ───────────────────────────────────────────────────────────────
    const h1Tags = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    const h1Texts = h1Tags.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    if (h1Tags.length === 0) {
      issues.push({
        title: 'No H1 tag found',
        severity: 'high',
        description: 'The page has no <h1> heading.',
        whyItMatters: 'H1 is the primary signal for search engines about the page topic.',
        recommendation: 'Add exactly one <h1> tag that includes your main keyword.',
        estimatedImpact: '+8 points',
      });
    } else if (h1Tags.length > 1) {
      issues.push({
        title: `Multiple H1 tags (${h1Tags.length} found)`,
        severity: 'medium',
        description: `Found ${h1Tags.length} H1 tags — only one is recommended per page.`,
        whyItMatters: 'Multiple H1s dilute keyword focus and confuse search engines.',
        recommendation: 'Keep only the most important H1 and demote others to H2/H3.',
        estimatedImpact: '+4 points',
        details: `H1 texts: ${h1Texts.slice(0, 3).join(' | ')}`,
      });
    }

    // ── H2-H6 structure ───────────────────────────────────────────────────────
    const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
    const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
    if (h1Tags.length > 0 && h2Count === 0) {
      issues.push({
        title: 'No H2 subheadings found',
        severity: 'low',
        description: 'Page has an H1 but no H2 subheadings to organize content.',
        whyItMatters: 'H2 tags help search engines and readers understand content structure.',
        recommendation: 'Break content into sections with H2 subheadings containing related keywords.',
        estimatedImpact: '+3 points',
        details: `Structure found: H1×${h1Tags.length}, H2×0, H3×${h3Count}`,
      });
    }

    // ── Robots meta tag ───────────────────────────────────────────────────────
    const robotsMetaMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i);
    const robotsMeta = robotsMetaMatch?.[1]?.toLowerCase() || '';
    if (robotsMeta.includes('noindex')) {
      issues.push({
        title: 'Page is set to noindex — hidden from Google',
        severity: 'critical',
        description: `<meta name="robots" content="${robotsMeta}"> prevents Google from indexing this page.`,
        whyItMatters: 'A noindex page will never appear in search results.',
        recommendation: 'Remove the noindex directive unless this page should intentionally be hidden.',
        estimatedImpact: '+30 points',
        details: `Found: <meta name="robots" content="${robotsMeta}">`,
      });
    } else if (robotsMeta.includes('nofollow')) {
      issues.push({
        title: 'Robots meta set to nofollow — links not followed',
        severity: 'medium',
        description: 'Google will not follow links on this page.',
        whyItMatters: 'Nofollow prevents link equity from flowing to your other pages.',
        recommendation: 'Remove nofollow unless intentional.',
        estimatedImpact: '+3 points',
        details: `Found: <meta name="robots" content="${robotsMeta}">`,
      });
    }

    // ── Images without alt text ───────────────────────────────────────────────
    const images = data.fetchedImages || [];
    const noAlt = images.filter((img) => !img.hasAlt);
    if (noAlt.length > 0) {
      issues.push({
        title: `${noAlt.length} image(s) missing alt text`,
        severity: noAlt.length > 3 ? 'high' : 'medium',
        description: `${noAlt.length} of ${images.length} images have no alt attribute.`,
        whyItMatters: 'Alt text helps search engines index images and ranks in Google Images.',
        recommendation: 'Add descriptive alt text to every <img> tag.',
        estimatedImpact: '+5 points',
        resourceUrl: noAlt[0]?.src,
        affectedUrls: noAlt.slice(0, 10).map(i => i.src),
        details: `Affected: ${noAlt.slice(0, 3).map(i => i.src.split('/').pop()).join(', ')}`,
      });
    }

    // ── Canonical tag ─────────────────────────────────────────────────────────
    if (!html.includes('rel="canonical"') && !html.includes("rel='canonical'")) {
      issues.push({
        title: 'Missing canonical tag',
        severity: 'medium',
        description: 'No <link rel="canonical"> found.',
        whyItMatters: 'Without canonical, Google may index duplicate URLs and split ranking signals.',
        recommendation: `Add: <link rel="canonical" href="${data.url}">`,
        estimatedImpact: '+3 points',
      });
    }

    // ── Open Graph tags ───────────────────────────────────────────────────────
    const hasOgTitle = html.includes('og:title');
    const hasOgDesc  = html.includes('og:description');
    const hasOgImage = html.includes('og:image');
    if (!hasOgTitle) {
      issues.push({
        title: 'Missing Open Graph meta tags',
        severity: 'low',
        description: 'No og:title / og:description / og:image tags found.',
        whyItMatters: 'Without OG tags, social media shares show poor previews reducing clicks.',
        recommendation: 'Add og:title, og:description, og:image, og:url and og:type.',
        estimatedImpact: '+2 points',
        details: `Missing: ${[!hasOgTitle && 'og:title', !hasOgDesc && 'og:description', !hasOgImage && 'og:image'].filter(Boolean).join(', ')}`,
      });
    } else if (!hasOgImage) {
      issues.push({
        title: 'Missing og:image — social previews have no thumbnail',
        severity: 'low',
        description: 'og:title and og:description are present but og:image is missing.',
        whyItMatters: 'Social posts without an image get far less engagement.',
        recommendation: 'Add <meta property="og:image" content="https://yoursite.com/social-preview.jpg">. Recommended size: 1200×630px.',
        estimatedImpact: '+2 points',
      });
    }

    // ── Twitter Card ──────────────────────────────────────────────────────────
    if (!html.includes('twitter:card')) {
      issues.push({
        title: 'Missing Twitter Card meta tags',
        severity: 'low',
        description: 'No twitter:card meta tag found.',
        whyItMatters: 'Without Twitter Cards, shared links on X/Twitter show plain text only.',
        recommendation: 'Add: <meta name="twitter:card" content="summary_large_image"> plus twitter:title, twitter:description, twitter:image.',
        estimatedImpact: '+1 point',
      });
    }

    // ── Hreflang ──────────────────────────────────────────────────────────────
    const hasHreflang = html.includes('hreflang');
    const isMultilingual = html.includes('lang="he"') || html.includes('lang="en"') || html.includes('/he/') || html.includes('/en/');
    if (isMultilingual && !hasHreflang) {
      issues.push({
        title: 'Multilingual site without hreflang tags',
        severity: 'medium',
        description: 'Site appears to have multiple languages but no hreflang annotations.',
        whyItMatters: 'Without hreflang, Google may show the wrong language version to users.',
        recommendation: 'Add <link rel="alternate" hreflang="he" href="..."> for each language version.',
        estimatedImpact: '+4 points',
        details: 'Missing hreflang for Hebrew (he) and English (en) versions.',
      });
    }

    // ── Favicon ───────────────────────────────────────────────────────────────
    const hasFavicon = html.includes('rel="icon"') || html.includes("rel='icon'")
      || html.includes('rel="shortcut icon"') || html.includes("rel='shortcut icon'");
    if (!hasFavicon) {
      issues.push({
        title: 'No favicon declared in HTML',
        severity: 'low',
        description: 'No <link rel="icon"> found in the page.',
        whyItMatters: 'Favicons appear in browser tabs, bookmarks and search results — building brand recognition.',
        recommendation: 'Add <link rel="icon" href="/favicon.ico"> in <head>. Include a 180×180 apple-touch-icon too.',
        estimatedImpact: '+1 point',
      });
    }

    // ── Sitemap & robots.txt ──────────────────────────────────────────────────
    if (data.hasSitemap === false) {
      issues.push({
        title: 'No sitemap.xml found',
        severity: 'medium',
        description: `${new URL(data.url).origin}/sitemap.xml returned an error or 404.`,
        whyItMatters: 'A sitemap tells Google which pages to crawl and when they were updated.',
        recommendation: 'Generate and submit a sitemap.xml. Submit it in Google Search Console.',
        estimatedImpact: '+4 points',
      });
    }
    if (data.hasRobotsTxt === false) {
      issues.push({
        title: 'No robots.txt found',
        severity: 'low',
        description: `${new URL(data.url).origin}/robots.txt returned an error or 404.`,
        whyItMatters: 'robots.txt guides crawlers and should reference your sitemap.',
        recommendation: 'Create a robots.txt file. Minimum content: User-agent: * Allow: / Sitemap: https://yoursite.com/sitemap.xml',
        estimatedImpact: '+2 points',
      });
    }

    // ── Word count / thin content ─────────────────────────────────────────────
    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 2).length;
    if (wordCount < 200) {
      issues.push({
        title: `Thin content — only ${wordCount} words`,
        severity: 'medium',
        description: 'Page has very little text content, which Google may classify as "thin content".',
        whyItMatters: 'Thin pages often rank poorly. Google prefers pages with substantial, useful content.',
        recommendation: 'Add at least 300-500 words of high-quality, relevant content.',
        estimatedImpact: '+5 points',
        details: `Detected ~${wordCount} words. Target: ≥ 300 words for informational pages.`,
      });
    }

    // ── Link count ────────────────────────────────────────────────────────────
    const allLinks = [...html.matchAll(/<a[^>]+href="([^"]+)"/gi)].map(m => m[1]);
    const origin = (() => { try { return new URL(data.url).origin; } catch { return ''; } })();
    const internalLinks = allLinks.filter(l => l.startsWith('/') || l.startsWith(origin));
    const externalLinks = allLinks.filter(l => l.startsWith('http') && !l.startsWith(origin));

    // ── Structured data ───────────────────────────────────────────────────────
    if (!html.includes('application/ld+json') && !html.includes('schema.org')) {
      issues.push({
        title: 'No structured data (JSON-LD / Schema.org)',
        severity: 'low',
        description: 'No structured data markup detected.',
        whyItMatters: 'Structured data enables rich results (stars, FAQs, breadcrumbs) in Google — dramatically increases CTR.',
        recommendation: 'Add JSON-LD schema relevant to your content type (LocalBusiness, Article, Product, etc.).',
        estimatedImpact: '+3 points',
      });
    }

    const score = this.calculateScore(issues);
    return {
      analyzer: this.name,
      score,
      issues,
      recommendations: [],
      metadata: {
        title: title || null,
        titleLength: title.length,
        metaDescLength: metaDesc.length,
        wordCount,
        h1Count: h1Tags.length,
        h1Text: h1Texts[0] || null,
        h2Count,
        h3Count,
        imageCount: images.length,
        imagesWithAlt: images.filter(i => i.hasAlt).length,
        internalLinks: internalLinks.length,
        externalLinks: externalLinks.length,
        hasCanonical: html.includes('rel="canonical"') || html.includes("rel='canonical'"),
        hasOgTags: hasOgTitle,
        hasOgImage,
        hasTwitterCard: html.includes('twitter:card'),
        hasHreflang,
        hasFavicon,
        hasSitemap: data.hasSitemap ?? null,
        hasRobotsTxt: data.hasRobotsTxt ?? null,
        robotsMeta: robotsMeta || 'index,follow',
      },
    };
  }
}
