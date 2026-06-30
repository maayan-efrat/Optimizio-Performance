import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

export class SEOAnalyzer extends BaseAnalyzer {
  name = 'seo';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';

    // 1. Title tag
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || '';
    if (!title) {
      issues.push({
        title: 'Missing <title> tag',
        severity: 'critical',
        description: 'No <title> tag found in the page.',
        whyItMatters: 'The title tag is the most important on-page SEO element.',
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
        details: `Current length: ${title.length} chars. Google shows ~60 chars.`,
      });
    }

    // 2. Meta description
    const metaDescMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)
      || html.match(/<meta[^>]+content="([^"]*)"[^>]+name="description"/i);
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
        description: `Current description: "${metaDesc}"`,
        whyItMatters: 'Short descriptions don\'t persuade users to click from search results.',
        recommendation: 'Expand to 120-160 characters with a clear value proposition.',
        estimatedImpact: '+4 points',
        details: `Current: "${metaDesc}" (${metaDesc.length} chars). Target: 120-160 chars.`,
      });
    } else if (metaDesc.length > 165) {
      issues.push({
        title: `Meta description too long (${metaDesc.length} chars)`,
        severity: 'low',
        description: 'Description will be truncated in search results.',
        whyItMatters: 'Truncated descriptions look unprofessional in SERPs.',
        recommendation: 'Shorten to 120-160 characters.',
        estimatedImpact: '+2 points',
      });
    }

    // 3. H1 tags
    const h1Tags = html.match(/<h1[^>]*>(.*?)<\/h1>/gis) || [];
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
        details: `H1 texts: ${h1Tags.slice(0, 2).map(h => h.replace(/<[^>]+>/g, '').trim()).join(' | ')}`,
      });
    }

    // 4. Images without alt text
    const images = data.fetchedImages || [];
    const noAlt = images.filter((img) => !img.hasAlt);
    if (noAlt.length > 0) {
      issues.push({
        title: `${noAlt.length} image(s) missing alt text`,
        severity: noAlt.length > 3 ? 'high' : 'medium',
        description: `${noAlt.length} of ${images.length} images have no alt attribute.`,
        whyItMatters: 'Alt text helps search engines index images and improves accessibility.',
        recommendation: 'Add descriptive alt text to every <img> tag.',
        estimatedImpact: '+5 points',
        resourceUrl: noAlt[0]?.src,
        details: `Missing alt on: ${noAlt.slice(0, 3).map(i => i.src.split('/').pop()).join(', ')}`,
      });
    }

    // 5. Canonical tag
    if (!html.includes('rel="canonical"')) {
      issues.push({
        title: 'Missing canonical tag',
        severity: 'medium',
        description: 'No <link rel="canonical"> found.',
        whyItMatters: 'Without canonical, Google may index duplicate URLs and split ranking signals.',
        recommendation: `Add: <link rel="canonical" href="${data.url}">`,
        estimatedImpact: '+3 points',
      });
    }

    // 6. Open Graph tags
    if (!html.includes('og:title')) {
      issues.push({
        title: 'Missing Open Graph meta tags',
        severity: 'low',
        description: 'No og:title / og:description found.',
        whyItMatters: 'Without OG tags, social media shares show poor previews.',
        recommendation: 'Add og:title, og:description, og:image, and og:url.',
        estimatedImpact: '+2 points',
      });
    }

    // 7. Schema / structured data
    if (!html.includes('application/ld+json') && !html.includes('schema.org')) {
      issues.push({
        title: 'No structured data (JSON-LD / Schema.org)',
        severity: 'low',
        description: 'No structured data markup detected.',
        whyItMatters: 'Structured data enables rich results (stars, FAQs, breadcrumbs) in Google.',
        recommendation: 'Add JSON-LD schema relevant to your content type.',
        estimatedImpact: '+3 points',
      });
    }

    const score = this.calculateScore(issues);
    return { analyzer: this.name, score, issues, recommendations: [] };
  }
}
