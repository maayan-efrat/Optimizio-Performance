import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

const PHONE_RE = /(\+972|05\d|0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}|\(\d{3}\)\s?\d{3}[-\s]\d{4}|\d{3}[-\s]\d{3}[-\s]\d{4})/;
const ADDRESS_RE = /(\d{1,5}\s+\w[\w\s]{3,40}(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|רחוב|שדרות|כביש))/i;

function isAppPage(url: string): boolean {
  const appPaths = [
    '/login', '/register', '/dashboard', '/admin', '/scan', '/report/',
    '/onboarding', '/settings', '/reset-password', '/forgot-password',
    '/payment/', '/scan-details', '/competitor-analysis', '/share/',
    '/reports', '/api/',
  ];
  try {
    const pathname = new URL(url).pathname;
    return appPaths.some(p => pathname === p || pathname.startsWith(p));
  } catch { return false; }
}

export class SEOAnalyzer extends BaseAnalyzer {
  name = 'seo';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';
    const appPage = isAppPage(data.url);
    const isDev = data.isDevelopment ?? false;

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
        codeExample: '<title>Your Business Name — Main Keyword | City</title>',
        estimatedImpact: '+15 points',
        businessImpact: 'לקוחות לא ימצאו את האתר שלכם בגוגל — הכותרת היא הדבר הראשון שגוגל בודק.',
        difficulty: 'easy',
        fixTime: '10 דקות',
      });
    } else if (title.length < 20) {
      issues.push({
        title: `Title too short (${title.length} chars): "${title}"`,
        severity: 'medium',
        description: 'Page title is under 20 characters — too brief to describe the page content.',
        whyItMatters: 'Short titles miss keyword opportunities and look weak in search results.',
        recommendation: 'Expand the title to 50-60 characters with the main keyword.',
        codeExample: `<title>${title} — [Main Keyword] | [Business Name]</title>`,
        estimatedImpact: '+5 points',
        businessImpact: 'פחות קליקים מגוגל — כותרת קצרה לא מספרת ללקוח מה הוא מוצא.',
        difficulty: 'easy',
        fixTime: '10 דקות',
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
        difficulty: 'easy',
        fixTime: '5 דקות',
        details: `Current: "${title}" — ${title.length} chars. Google shows ~60 chars.`,
      });
    }

    // ── Title = H1 duplicate ──────────────────────────────────────────────────
    const h1Tags = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    const h1Texts = h1Tags.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    if (title && h1Texts.length === 1 && title.toLowerCase() === h1Texts[0].toLowerCase()) {
      issues.push({
        title: 'Title and H1 are identical',
        severity: 'low',
        description: `Your <title> and <h1> contain exactly the same text: "${title}".`,
        whyItMatters: 'Identical title and H1 miss the opportunity to target additional keyword variations and make the page feel repetitive.',
        recommendation: 'Keep the same topic but vary the wording. The title can be shorter and keyword-focused; the H1 can be more descriptive for readers.',
        estimatedImpact: '+2 points',
        difficulty: 'easy',
        fixTime: '10 דקות',
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
        codeExample: '<meta name="description" content="[Your compelling 120-160 char description with main keyword]">',
        estimatedImpact: '+8 points',
        businessImpact: 'גוגל בוחר טקסט אקראי מהדף — לקוחות פוטנציאליים רואים תוכן לא קשור ולא לוחצים.',
        difficulty: 'easy',
        fixTime: '15 דקות',
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
    if (h1Tags.length === 0) {
      issues.push({
        title: 'No H1 tag found',
        severity: 'high',
        description: 'The page has no <h1> heading.',
        whyItMatters: 'H1 is the primary signal for search engines about the page topic.',
        recommendation: 'Add exactly one <h1> tag that includes your main keyword.',
        codeExample: '<h1>Main Keyword — Compelling Description</h1>',
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

    // ── X-Robots-Tag header ───────────────────────────────────────────────────
    const xRobotsTag = (data.responseHeaders?.['x-robots-tag'] || '').toLowerCase();
    if (xRobotsTag.includes('noindex')) {
      issues.push({
        title: 'X-Robots-Tag header set to noindex — hidden from Google',
        severity: 'critical',
        description: `The server sends X-Robots-Tag: ${xRobotsTag} — this hides the page from search engines.`,
        whyItMatters: 'X-Robots-Tag overrides HTML robots meta. A noindex here means the page never appears in search results, even if the HTML tag says otherwise.',
        recommendation: 'Check your server configuration and remove the noindex directive from X-Robots-Tag.',
        estimatedImpact: '+30 points',
        details: `X-Robots-Tag: ${xRobotsTag}`,
      });
    }

    // ── Meta refresh redirect ─────────────────────────────────────────────────
    const metaRefreshMatch = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'](\d+)/i);
    if (metaRefreshMatch) {
      const delay = parseInt(metaRefreshMatch[1], 10);
      issues.push({
        title: `Meta refresh redirect detected (${delay}s delay)`,
        severity: delay === 0 ? 'high' : 'medium',
        description: `<meta http-equiv="refresh"> redirects the page after ${delay} seconds.`,
        whyItMatters: 'Meta refresh redirects are bad for SEO — Google may not follow them, and they create a poor user experience with an unnecessary delay.',
        recommendation: 'Replace with a proper 301 server-side redirect (via .htaccess, nginx, or your framework).',
        codeExample: '# In .htaccess:\nRedirect 301 /old-page https://yoursite.com/new-page',
        estimatedImpact: '+5 points',
        difficulty: 'medium',
        fixTime: '30 דקות',
      });
    }

    // ── URL structure checks ──────────────────────────────────────────────────
    try {
      const parsedUrl = new URL(data.url);
      const pathname = parsedUrl.pathname;

      if (data.url.length > 115) {
        issues.push({
          title: `URL too long (${data.url.length} chars)`,
          severity: 'low',
          description: `Current URL: ${data.url}`,
          whyItMatters: 'Long URLs are hard to share, look untrustworthy, and may be truncated in search results.',
          recommendation: 'Keep URLs under 115 characters. Use short, descriptive slugs.',
          estimatedImpact: '+2 points',
        });
      }

      if (pathname.includes('_') && !pathname.startsWith('/_next/')) {
        issues.push({
          title: 'URL contains underscores instead of hyphens',
          severity: 'low',
          description: `URL path uses underscores: ${pathname}`,
          whyItMatters: 'Google treats underscores as part of a word (e.g. "web_page" = one word), while hyphens separate words. Hyphenated URLs rank better for multi-word keywords.',
          recommendation: 'Replace underscores with hyphens in URL slugs (e.g. /my-page instead of /my_page).',
          estimatedImpact: '+2 points',
          difficulty: 'medium',
          fixTime: '30 דקות',
        });
      }

      if (pathname.includes('%20')) {
        issues.push({
          title: 'URL contains encoded spaces (%20)',
          severity: 'low',
          description: `URL path contains %20: ${pathname}`,
          whyItMatters: 'Encoded spaces look unprofessional, break when shared, and are a signal of poor URL structure.',
          recommendation: 'Replace spaces with hyphens in URL slugs and set up 301 redirects from old URLs.',
          estimatedImpact: '+2 points',
          difficulty: 'medium',
          fixTime: '30 דקות',
        });
      }

      if (pathname !== pathname.toLowerCase()) {
        issues.push({
          title: 'URL contains uppercase letters',
          severity: 'low',
          description: `URL path has mixed case: ${pathname}`,
          whyItMatters: 'Mixed-case URLs can create duplicate content issues — /Page and /page are treated as different URLs by some servers.',
          recommendation: 'Use lowercase URLs only and redirect uppercase versions with 301s.',
          estimatedImpact: '+2 points',
          difficulty: 'easy',
          fixTime: '15 דקות',
        });
      }
    } catch {}

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
        codeExample: '<img src="product.jpg" alt="[descriptive text about the image]" width="800" height="600">',
        estimatedImpact: '+5 points',
        resourceUrl: noAlt[0]?.src,
        affectedUrls: noAlt.slice(0, 10).map(i => i.src),
        details: `Affected: ${noAlt.slice(0, 3).map(i => i.src.split('/').pop()).join(', ')}`,
      });
    }

    // ── Canonical tag ─────────────────────────────────────────────────────────
    const hasCanonical = html.includes('rel="canonical"') || html.includes("rel='canonical'");
    if (!isDev && !hasCanonical) {
      issues.push({
        title: 'Missing canonical tag',
        severity: 'medium',
        description: 'No <link rel="canonical"> found.',
        whyItMatters: 'Without canonical, Google may index duplicate URLs and split ranking signals.',
        recommendation: `Add: <link rel="canonical" href="${data.url}">`,
        codeExample: `<link rel="canonical" href="${data.url}">`,
        estimatedImpact: '+3 points',
      });
    }

    // Canonical URL checks (always run — these detect real misconfigurations)
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
      ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
    const canonicalUrl = canonicalMatch?.[1]?.trim() ?? null;

    const ogUrlMatch = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i);
    const ogUrl = ogUrlMatch?.[1]?.trim() ?? null;

    if (ogUrl && canonicalUrl && ogUrl !== canonicalUrl) {
      issues.push({
        title: 'og:url and canonical URL mismatch',
        severity: 'medium',
        description: `og:url: "${ogUrl}" ≠ canonical: "${canonicalUrl}"`,
        whyItMatters: 'Mismatched canonical and og:url confuse search engines and social crawlers about the authoritative URL.',
        recommendation: 'Ensure og:url and canonical both point to the same canonical version of the page.',
        estimatedImpact: '+2 points',
        details: `og:url: ${ogUrl}\ncanonical: ${canonicalUrl}`,
      });
    }

    if (canonicalUrl) {
      try {
        if (!canonicalUrl.startsWith('/') && !canonicalUrl.includes(new URL(data.url).hostname)) {
          issues.push({
            title: 'Canonical URL points to a different domain',
            severity: 'high',
            description: `Canonical href="${canonicalUrl}" points to a different domain than the current page.`,
            whyItMatters: 'A cross-domain canonical tells Google to index a different domain instead — this page will be excluded from search results.',
            recommendation: 'Verify the canonical URL is correct. If this page should be indexed, change the canonical to match the current URL.',
            estimatedImpact: '+10 points',
            details: `Page domain: ${new URL(data.url).hostname}\nCanonical: ${canonicalUrl}`,
          });
        }
      } catch {}
    }

    // ── Open Graph tags ───────────────────────────────────────────────────────
    const hasOgTitle = html.includes('og:title');
    const hasOgDesc  = html.includes('og:description');
    const hasOgImage = html.includes('og:image');
    if (!isDev && !hasOgTitle) {
      issues.push({
        title: 'Missing Open Graph meta tags',
        severity: 'low',
        description: 'No og:title / og:description / og:image tags found.',
        whyItMatters: 'Without OG tags, social media shares show poor previews reducing clicks.',
        recommendation: 'Add og:title, og:description, og:image, og:url and og:type.',
        codeExample: '<meta property="og:title" content="[Page Title]">\n<meta property="og:description" content="[Description]">\n<meta property="og:image" content="https://yoursite.com/og-image.jpg">\n<meta property="og:url" content="[Page URL]">',
        estimatedImpact: '+2 points',
        details: `Missing: ${[!hasOgTitle && 'og:title', !hasOgDesc && 'og:description', !hasOgImage && 'og:image'].filter(Boolean).join(', ')}`,
      });
    } else if (!isDev && hasOgTitle && !hasOgImage) {
      issues.push({
        title: 'Missing og:image — social previews have no thumbnail',
        severity: 'low',
        description: 'og:title and og:description are present but og:image is missing.',
        whyItMatters: 'Social posts without an image get far less engagement.',
        recommendation: 'Add <meta property="og:image" content="https://yoursite.com/social-preview.jpg">. Recommended size: 1200×630px.',
        codeExample: '<meta property="og:image" content="https://yoursite.com/og-image.jpg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">',
        estimatedImpact: '+2 points',
      });
    }

    // ── Twitter Card ──────────────────────────────────────────────────────────
    if (!isDev && !html.includes('twitter:card')) {
      issues.push({
        title: 'Missing Twitter Card meta tags',
        severity: 'low',
        description: 'No twitter:card meta tag found.',
        whyItMatters: 'Without Twitter Cards, shared links on X/Twitter show plain text only.',
        recommendation: 'Add: <meta name="twitter:card" content="summary_large_image"> plus twitter:title, twitter:description, twitter:image.',
        codeExample: '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="[Title]">\n<meta name="twitter:description" content="[Description]">',
        estimatedImpact: '+1 point',
      });
    }

    // ── Hreflang ──────────────────────────────────────────────────────────────
    const hasHreflang = html.includes('hreflang');
    const isMultilingual = html.includes('lang="he"') || html.includes('lang="en"') || html.includes('/he/') || html.includes('/en/');
    if (!isDev && isMultilingual && !hasHreflang) {
      issues.push({
        title: 'Multilingual site without hreflang tags',
        severity: 'medium',
        description: 'Site appears to have multiple languages but no hreflang annotations.',
        whyItMatters: 'Without hreflang, Google may show the wrong language version to users.',
        recommendation: 'Add <link rel="alternate" hreflang="he" href="..."> for each language version.',
        codeExample: '<link rel="alternate" hreflang="he" href="https://yoursite.com/">\n<link rel="alternate" hreflang="en" href="https://yoursite.com/en/">\n<link rel="alternate" hreflang="x-default" href="https://yoursite.com/">',
        estimatedImpact: '+4 points',
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
        codeExample: '<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" href="/icon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
        estimatedImpact: '+1 point',
      });
    }

    // ── PWA / manifest ────────────────────────────────────────────────────────
    const hasManifest = /rel=["']manifest["']/i.test(html);
    if (!hasManifest) {
      issues.push({
        title: 'No Web App Manifest (PWA)',
        severity: 'low',
        description: 'No <link rel="manifest"> found — site is not installable as a PWA.',
        whyItMatters: 'Progressive Web Apps can be installed on phones, get push notifications, and work offline — improving engagement.',
        recommendation: 'Add a manifest.json and link it in <head>: <link rel="manifest" href="/manifest.json">. Include name, icons, and start_url.',
        estimatedImpact: '+2 points',
        details: 'Google also uses manifest presence as a signal for mobile UX quality.',
      });
    }

    // ── Sitemap & robots.txt ──────────────────────────────────────────────────
    if (!isDev && data.hasSitemap === false) {
      issues.push({
        title: 'No sitemap.xml found',
        severity: 'medium',
        description: `${new URL(data.url).origin}/sitemap.xml returned an error or 404.`,
        whyItMatters: 'A sitemap tells Google which pages to crawl and when they were updated.',
        recommendation: 'Generate and submit a sitemap.xml. Submit it in Google Search Console.',
        estimatedImpact: '+4 points',
      });
    }
    if (!isDev && data.hasRobotsTxt === false) {
      issues.push({
        title: 'No robots.txt found',
        severity: 'low',
        description: `${new URL(data.url).origin}/robots.txt returned an error or 404.`,
        whyItMatters: 'robots.txt guides crawlers and should reference your sitemap.',
        recommendation: 'Create a robots.txt file. Minimum content: User-agent: * Allow: / Sitemap: https://yoursite.com/sitemap.xml',
        codeExample: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /login/\nSitemap: https://yoursite.com/sitemap.xml',
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
    const readingTimeMin = Math.ceil(wordCount / 200);
    if (!appPage && wordCount < 200) {
      issues.push({
        title: `Thin content — only ${wordCount} words`,
        severity: 'medium',
        description: 'Page has very little text content, which Google may classify as "thin content".',
        whyItMatters: 'Thin pages often rank poorly. Google prefers pages with substantial, useful content.',
        recommendation: 'Add at least 300-500 words of high-quality, relevant content.',
        estimatedImpact: '+5 points',
        businessImpact: 'עמוד עם מעט מדי טקסט מדורג נמוך בגוגל — לקוחות פוטנציאליים לא מוצאים אתכם.',
        difficulty: 'medium',
        fixTime: '2-3 שעות',
        details: `Detected ~${wordCount} words. Target: ≥ 300 words for informational pages.`,
      });
    }

    // ── Contact info (local SEO) ──────────────────────────────────────────────
    const hasPhone   = PHONE_RE.test(textContent);
    const hasAddress = ADDRESS_RE.test(textContent);
    const hasMapsEmbed = /maps\.google\.|google\.com\/maps|maps\.googleapis/i.test(html);
    if (!appPage && !hasPhone && !hasAddress && !hasMapsEmbed) {
      issues.push({
        title: 'No contact information detected',
        severity: 'low',
        description: 'No phone number, physical address, or Google Maps embed found.',
        whyItMatters: 'For local businesses, contact details are critical for local SEO and building trust. Google uses them for Local Pack rankings.',
        recommendation: 'Add your phone number, address, and an embedded Google Map to a Contact section. Also add LocalBusiness schema.',
        estimatedImpact: '+3 points',
        businessImpact: 'לקוחות שמחפשים "עסק + עיר" לא ימצאו אתכם — Google משתמש בפרטי קשר לדירוג מקומי.',
        difficulty: 'easy',
        fixTime: '30 דקות',
        details: 'Local businesses without contact info rank lower in Google Maps / local search.',
      });
    }

    // ── Click-to-call (tel:) ──────────────────────────────────────────────────
    const hasClickToCall = /href=["']tel:/i.test(html);
    if (!hasClickToCall && hasPhone) {
      issues.push({
        title: 'Phone number not linked as click-to-call',
        severity: 'low',
        description: 'A phone number is visible in the text but not wrapped in a <a href="tel:..."> link.',
        whyItMatters: 'Mobile users cannot tap a plain text phone number to call. Click-to-call links increase mobile conversion rate significantly.',
        recommendation: 'Wrap your phone number: <a href="tel:+97250XXXXXXX">050-XXXXXXX</a>',
        codeExample: '<a href="tel:+972501234567">050-123-4567</a>',
        estimatedImpact: '+2 points',
      });
    }

    // ── WhatsApp link ─────────────────────────────────────────────────────────
    const hasWhatsApp = /href=["'](?:https?:\/\/wa\.me|https?:\/\/api\.whatsapp\.com|whatsapp:\/\/send)/i.test(html);
    if (!appPage && !isDev && !hasWhatsApp) {
      issues.push({
        title: 'No WhatsApp contact link',
        severity: 'low',
        description: 'No WhatsApp link (wa.me) found on the page.',
        whyItMatters: 'WhatsApp is the most common communication channel for Israeli businesses. A WhatsApp button can double contact-form conversion rates.',
        recommendation: 'Add a WhatsApp button: <a href="https://wa.me/97250XXXXXXX">Chat on WhatsApp</a>',
        codeExample: '<a href="https://wa.me/972501234567" target="_blank" rel="noopener noreferrer">💬 דבר איתנו בוואטסאפ</a>',
        estimatedImpact: '+2 points',
        businessImpact: 'לקוחות ישראלים מעדיפים WhatsApp — כפתור אחד יכול להכפיל את שיעור יצירת הקשר.',
        difficulty: 'easy',
        fixTime: '15 דקות',
      });
    }

    // ── Social sharing buttons ────────────────────────────────────────────────
    const hasSocialShare = /(?:sharer|share\?|addthis|sharethis|addtoany|facebook\.com\/sharer|twitter\.com\/intent|whatsapp:\/\/send|linkedin\.com\/shareArticle)/i.test(html);
    if (!appPage && !isDev && !hasSocialShare) {
      issues.push({
        title: 'No social sharing buttons found',
        severity: 'low',
        description: 'No social sharing links or widgets detected on the page.',
        whyItMatters: 'Social shares drive referral traffic and social signals that correlate with better rankings.',
        recommendation: 'Add share buttons for Facebook, WhatsApp, LinkedIn and X/Twitter. Services like AddToAny make it easy.',
        estimatedImpact: '+1 point',
      });
    }

    // ── Tech stack SEO notes ──────────────────────────────────────────────────
    const cms = data.techStack?.cms;
    if (cms === 'Wix') {
      issues.push({
        title: 'Wix detected — known SEO limitations',
        severity: 'low',
        description: 'Site is built on Wix, which has documented SEO limitations.',
        whyItMatters: 'Wix generates JavaScript-heavy pages that can be slower to crawl. Server-side rendering is limited and JS bloat is common.',
        recommendation: 'Ensure all meta tags, schema, and alt text are set in Wix SEO settings. Consider migrating to WordPress or Webflow for advanced SEO control.',
        estimatedImpact: 'Informational',
      });
    } else if (cms === 'Squarespace') {
      issues.push({
        title: 'Squarespace detected — limited structured data support',
        severity: 'low',
        description: 'Site is built on Squarespace.',
        whyItMatters: 'Squarespace has limited custom schema/JSON-LD support. Technical SEO customization is restricted.',
        recommendation: 'Use all available Squarespace SEO fields. For advanced schema needs, consider migrating to a more flexible platform.',
        estimatedImpact: 'Informational',
      });
    }

    // ── Structured data ───────────────────────────────────────────────────────
    if (!html.includes('application/ld+json') && !html.includes('schema.org')) {
      issues.push({
        title: 'No structured data (JSON-LD / Schema.org)',
        severity: 'low',
        description: 'No structured data markup detected.',
        whyItMatters: 'Structured data enables rich results (stars, FAQs, breadcrumbs) in Google — dramatically increases CTR.',
        recommendation: 'Add JSON-LD schema relevant to your content type (LocalBusiness, Article, Product, etc.).',
        codeExample: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "LocalBusiness",\n  "name": "Your Business",\n  "telephone": "+972-50-000-0000",\n  "address": {\n    "@type": "PostalAddress",\n    "addressLocality": "Tel Aviv",\n    "addressCountry": "IL"\n  }\n}\n</script>',
        estimatedImpact: '+3 points',
      });
    }

    // ── Link count ────────────────────────────────────────────────────────────
    const allLinks = [...html.matchAll(/<a[^>]+href="([^"]+)"/gi)].map(m => m[1]);
    const origin = (() => { try { return new URL(data.url).origin; } catch { return ''; } })();
    const internalLinks = allLinks.filter(l => l.startsWith('/') || l.startsWith(origin));
    const externalLinks = allLinks.filter(l => l.startsWith('http') && !l.startsWith(origin));

    if (allLinks.length > 300) {
      issues.push({
        title: `Too many links on page (${allLinks.length})`,
        severity: 'medium',
        description: `Found ${allLinks.length} links on the page (threshold: 300).`,
        whyItMatters: 'Google crawlers follow a limited number of links per page. Too many links dilute PageRank across all linked pages.',
        recommendation: 'Remove unnecessary links, especially navigation duplicates and footer link spam.',
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
        readingTimeMin,
        h1Count: h1Tags.length,
        h1Text: h1Texts[0] || null,
        h2Count,
        h3Count,
        imageCount: images.length,
        imagesWithAlt: images.filter(i => i.hasAlt).length,
        internalLinks: internalLinks.length,
        externalLinks: externalLinks.length,
        hasCanonical,
        hasOgTags: hasOgTitle,
        hasOgImage,
        hasTwitterCard: html.includes('twitter:card'),
        hasHreflang,
        hasFavicon,
        hasManifest,
        hasSitemap: data.hasSitemap ?? null,
        hasRobotsTxt: data.hasRobotsTxt ?? null,
        robotsMeta: robotsMeta || 'index,follow',
        hasContactInfo: hasPhone || hasAddress || hasMapsEmbed,
        hasClickToCall,
        hasWhatsApp,
        hasSocialShare,
        detectedCms: data.techStack?.cms ?? null,
        detectedFramework: data.techStack?.framework ?? null,
        techTags: data.techStack?.tags ?? [],
        isDevelopment: isDev,
      },
    };
  }
}
