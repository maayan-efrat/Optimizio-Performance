import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

const UA = 'Mozilla/5.0 (compatible; Optimizio-Scanner/2.0)';
const MAX_LINKS = 15;
const TIMEOUT_MS = 4_000;

interface LinkResult {
  url: string;
  status: number | null;
  redirected: boolean;
  finalUrl: string | null;
  error: string | null;
}

export class LinksAnalyzer extends BaseAnalyzer {
  name = 'links';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';

    let origin: string;
    try { origin = new URL(data.url).origin; }
    catch { return { analyzer: this.name, score: 100, issues: [], recommendations: [] }; }

    // Extract internal links
    const hrefMatches = [...html.matchAll(/href=["']([^"'#?][^"']*?)["']/gi)];
    const internalLinks = Array.from(new Set(
      hrefMatches
        .map(m => {
          try {
            const resolved = new URL(m[1], data.url);
            return resolved.origin === origin ? resolved.href : null;
          } catch { return null; }
        })
        .filter((u): u is string => u !== null && u !== data.url)
    )).slice(0, MAX_LINKS);

    if (internalLinks.length === 0) {
      return {
        analyzer: this.name,
        score: 100,
        issues: [],
        recommendations: [],
        metadata: { checkedLinks: 0, brokenLinks: 0, redirectedLinks: 0 },
      };
    }

    // Probe links in parallel
    const results = await Promise.all(internalLinks.map(url => this.probeLink(url)));

    const broken = results.filter(r => r.status !== null && r.status >= 400);
    const redirected = results.filter(r => r.redirected && (!r.status || r.status < 400));
    const errored = results.filter(r => r.error && r.status === null);

    if (broken.length > 0) {
      const affectedUrls = broken.map(r => r.url);
      issues.push({
        title: `${broken.length} broken link(s) found (4xx/5xx)`,
        severity: broken.length > 3 ? 'high' : 'medium',
        description: `Found ${broken.length} internal link(s) returning error status codes.`,
        whyItMatters: 'Broken links hurt user experience, waste crawl budget, and signal poor site maintenance to search engines.',
        recommendation: 'Fix or redirect broken URLs. Use a permanent 301 redirect if the page has moved.',
        estimatedImpact: broken.length > 3 ? '+8 points' : '+4 points',
        affectedUrls,
        details: broken.map(r => `${r.url} → ${r.status}`).join('\n'),
      });
    }

    if (redirected.length > 2) {
      issues.push({
        title: `${redirected.length} redirect(s) detected on internal links`,
        severity: 'low',
        description: `${redirected.length} internal links redirect to a different URL before resolving.`,
        whyItMatters: 'Redirect chains waste crawl budget and add latency for users following internal links.',
        recommendation: 'Update internal links to point directly to the final destination URL.',
        estimatedImpact: '+2-3 points',
        affectedUrls: redirected.map(r => r.url),
        details: redirected.map(r => `${r.url} → ${r.finalUrl}`).join('\n'),
      });
    }

    if (errored.length > 2) {
      issues.push({
        title: `${errored.length} internal link(s) unreachable`,
        severity: 'medium',
        description: `${errored.length} internal link(s) timed out or failed to connect.`,
        whyItMatters: 'Unreachable pages frustrate users and may indicate server configuration issues.',
        recommendation: 'Verify these pages are online and accessible to crawlers.',
        estimatedImpact: '+3 points',
        affectedUrls: errored.map(r => r.url),
      });
    }

    return {
      analyzer: this.name,
      score: this.calculateScore(issues),
      issues,
      recommendations: [],
      metadata: {
        checkedLinks: results.length,
        brokenLinks: broken.length,
        redirectedLinks: redirected.length,
      },
    };
  }

  private async probeLink(url: string): Promise<LinkResult> {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': UA },
        redirect: 'follow',
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      return {
        url,
        status: res.status,
        redirected: res.redirected,
        finalUrl: res.url !== url ? res.url : null,
        error: null,
      };
    } catch (err: any) {
      return { url, status: null, redirected: false, finalUrl: null, error: err?.message ?? 'unknown' };
    }
  }
}
