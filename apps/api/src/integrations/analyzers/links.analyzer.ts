import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

const UA = 'Mozilla/5.0 (compatible; Optimizio-Scanner/2.0)';
const MAX_INTERNAL = 15;
const MAX_EXTERNAL = 6;
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

    // ── Custom 404 page ───────────────────────────────────────────────────────
    if (data.hasCustom404 === false) {
      issues.push({
        title: 'No custom 404 page detected',
        severity: 'medium',
        description: 'Visiting a non-existent URL returns a server error instead of a branded 404 page.',
        whyItMatters: 'A custom 404 page with navigation keeps users on the site instead of bouncing. Google also uses it to detect crawl health.',
        recommendation: 'Create a friendly 404.html with a search bar, popular links, and your branding. Configure your server/CMS to use it.',
        estimatedImpact: '+3 points',
        details: `Probed ${origin}/[random-path] — no custom 404 response detected.`,
      });
    }

    // ── Extract links ─────────────────────────────────────────────────────────
    const hrefMatches = [...html.matchAll(/href=["']([^"'#?][^"']*?)["']/gi)];
    const allResolved = hrefMatches
      .map(m => {
        try {
          const resolved = new URL(m[1], data.url);
          if (!resolved.protocol.startsWith('http')) return null;
          return { href: resolved.href, isInternal: resolved.origin === origin };
        } catch { return null; }
      })
      .filter((u): u is { href: string; isInternal: boolean } => u !== null && u.href !== data.url);

    const internalLinks = Array.from(new Set(
      allResolved.filter(u => u.isInternal).map(u => u.href)
    )).slice(0, MAX_INTERNAL);

    const externalLinks = Array.from(new Set(
      allResolved.filter(u => !u.isInternal).map(u => u.href)
    )).slice(0, MAX_EXTERNAL);

    if (internalLinks.length === 0 && externalLinks.length === 0) {
      return {
        analyzer: this.name,
        score: this.calculateScore(issues),
        issues,
        recommendations: [],
        metadata: { checkedLinks: 0, brokenLinks: 0, redirectedLinks: 0, hasCustom404: data.hasCustom404 ?? null },
      };
    }

    // ── Probe all links in parallel ───────────────────────────────────────────
    const [internalResults, externalResults] = await Promise.all([
      Promise.all(internalLinks.map(url => this.probeLink(url))),
      Promise.all(externalLinks.map(url => this.probeLink(url))),
    ]);

    const allResults = [...internalResults, ...externalResults];

    // ── Internal broken links ─────────────────────────────────────────────────
    const brokenInternal = internalResults.filter(r => r.status !== null && r.status >= 400);
    if (brokenInternal.length > 0) {
      issues.push({
        title: `${brokenInternal.length} broken internal link(s) (4xx/5xx)`,
        severity: brokenInternal.length > 3 ? 'high' : 'medium',
        description: `${brokenInternal.length} internal links return error status codes.`,
        whyItMatters: 'Broken internal links hurt user experience, waste crawl budget, and signal poor site maintenance to search engines.',
        recommendation: 'Fix or 301-redirect these broken URLs.',
        estimatedImpact: brokenInternal.length > 3 ? '+8 points' : '+4 points',
        affectedUrls: brokenInternal.map(r => r.url),
        details: brokenInternal.map(r => `${r.url} → ${r.status}`).join('\n'),
      });
    }

    // ── External broken links ─────────────────────────────────────────────────
    const brokenExternal = externalResults.filter(r => r.status !== null && r.status >= 400);
    if (brokenExternal.length > 0) {
      issues.push({
        title: `${brokenExternal.length} broken external link(s)`,
        severity: 'low',
        description: `${brokenExternal.length} outbound links point to pages returning 4xx/5xx errors.`,
        whyItMatters: 'Broken outbound links look unprofessional and may hurt trust signals with Google.',
        recommendation: 'Update or remove links to pages that no longer exist.',
        estimatedImpact: '+2 points',
        affectedUrls: brokenExternal.map(r => r.url),
        details: brokenExternal.map(r => `${r.url} → ${r.status}`).join('\n'),
      });
    }

    // ── Redirect chains ───────────────────────────────────────────────────────
    const redirected = internalResults.filter(r => r.redirected && (!r.status || r.status < 400));
    if (redirected.length > 2) {
      issues.push({
        title: `${redirected.length} redirect(s) on internal links`,
        severity: 'low',
        description: `${redirected.length} internal links redirect before resolving.`,
        whyItMatters: 'Redirect chains waste crawl budget and add latency for users.',
        recommendation: 'Update internal links to point directly to the final destination URL.',
        estimatedImpact: '+2-3 points',
        affectedUrls: redirected.map(r => r.url),
        details: redirected.map(r => `${r.url} → ${r.finalUrl}`).join('\n'),
      });
    }

    // ── Unreachable links ─────────────────────────────────────────────────────
    const errored = internalResults.filter(r => r.error && r.status === null);
    if (errored.length > 2) {
      issues.push({
        title: `${errored.length} internal link(s) unreachable (timeout/error)`,
        severity: 'medium',
        description: `${errored.length} internal links timed out or failed to connect.`,
        whyItMatters: 'Unreachable pages frustrate users and may indicate server configuration issues.',
        recommendation: 'Verify these pages are online and accessible to crawlers.',
        estimatedImpact: '+3 points',
        affectedUrls: errored.map(r => r.url),
      });
    }

    // ── No external links at all ──────────────────────────────────────────────
    const totalExternal = allResolved.filter(u => !u.isInternal).length;
    if (totalExternal === 0 && html.length > 5000) {
      issues.push({
        title: 'No external links on this page',
        severity: 'low',
        description: 'The page contains no outbound links to external websites.',
        whyItMatters: 'Linking to authoritative external sources improves topical trust and user experience.',
        recommendation: 'Add 2-3 links to relevant, authoritative sources in your content.',
        estimatedImpact: '+1 point',
      });
    }

    return {
      analyzer: this.name,
      score: this.calculateScore(issues),
      issues,
      recommendations: [],
      metadata: {
        checkedLinks: allResults.length,
        internalChecked: internalResults.length,
        externalChecked: externalResults.length,
        brokenLinks: brokenInternal.length + brokenExternal.length,
        redirectedLinks: redirected.length,
        hasCustom404: data.hasCustom404 ?? null,
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
