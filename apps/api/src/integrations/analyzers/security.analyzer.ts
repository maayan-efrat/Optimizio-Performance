import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

export class SecurityAnalyzer extends BaseAnalyzer {
  name = 'security';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';
    const headers = data.responseHeaders || {};

    const h = (name: string) => headers[name.toLowerCase()] || '';

    // 1. HTTPS check
    if (!data.url.startsWith('https://')) {
      issues.push({
        title: 'Site does not use HTTPS',
        severity: 'critical',
        description: `The scanned URL uses HTTP: ${data.url}`,
        whyItMatters: 'HTTP transmits data in plaintext — passwords and personal data are exposed.',
        recommendation: 'Install an SSL/TLS certificate (free via Let\'s Encrypt) and redirect HTTP → HTTPS.',
        estimatedImpact: '+20 points',
        details: 'Google marks HTTP sites as "Not Secure" in Chrome.',
      });
    }

    // 2. HSTS
    if (!h('strict-transport-security')) {
      issues.push({
        title: 'Missing Strict-Transport-Security (HSTS) header',
        severity: 'high',
        description: 'The server does not return an HSTS header.',
        whyItMatters: 'Without HSTS, browsers may load the site over HTTP, enabling man-in-the-middle attacks.',
        recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        estimatedImpact: '+8 points',
        details: 'HSTS tells browsers to always use HTTPS for this domain.',
      });
    }

    // 3. Content-Security-Policy
    if (!h('content-security-policy')) {
      issues.push({
        title: 'Missing Content-Security-Policy (CSP) header',
        severity: 'high',
        description: 'No CSP header returned by the server.',
        whyItMatters: 'Without CSP, the site is vulnerable to cross-site scripting (XSS) attacks.',
        recommendation: "Add a Content-Security-Policy header. Start with: default-src 'self'",
        estimatedImpact: '+8 points',
        details: 'CSP whitelists which sources can load scripts, styles, and media.',
      });
    }

    // 4. X-Frame-Options / frame-ancestors
    if (!h('x-frame-options') && !(h('content-security-policy').includes('frame-ancestors'))) {
      issues.push({
        title: 'Missing X-Frame-Options header (clickjacking risk)',
        severity: 'medium',
        description: 'Site can be embedded in an <iframe> on any domain.',
        whyItMatters: 'Attackers can overlay transparent frames to trick users into clicking (clickjacking).',
        recommendation: 'Add: X-Frame-Options: SAMEORIGIN  (or use CSP frame-ancestors)',
        estimatedImpact: '+5 points',
      });
    }

    // 5. X-Content-Type-Options
    if (!h('x-content-type-options')) {
      issues.push({
        title: 'Missing X-Content-Type-Options header',
        severity: 'medium',
        description: 'Server does not send X-Content-Type-Options: nosniff.',
        whyItMatters: 'Without it, browsers may "sniff" file types, enabling MIME-confusion attacks.',
        recommendation: 'Add: X-Content-Type-Options: nosniff',
        estimatedImpact: '+4 points',
      });
    }

    // 6. Referrer-Policy
    if (!h('referrer-policy')) {
      issues.push({
        title: 'Missing Referrer-Policy header',
        severity: 'low',
        description: 'No Referrer-Policy header found.',
        whyItMatters: 'Without it, the full URL may be sent as Referer to third parties, leaking user paths.',
        recommendation: 'Add: Referrer-Policy: strict-origin-when-cross-origin',
        estimatedImpact: '+2 points',
      });
    }

    // 7. Inline scripts (XSS surface)
    const inlineScripts = (html.match(/<script(?![^>]+src)[^>]*>[^<]{50,}/g) || []).length;
    if (inlineScripts > 3) {
      issues.push({
        title: `${inlineScripts} inline <script> blocks detected`,
        severity: 'low',
        description: `Found ${inlineScripts} substantial inline script blocks.`,
        whyItMatters: 'Inline scripts expand XSS attack surface and prevent strict CSP policies.',
        recommendation: 'Move scripts to external files so you can use a strict Content-Security-Policy.',
        estimatedImpact: '+3 points',
        details: 'Inline scripts require unsafe-inline in CSP, which weakens protection.',
      });
    }

    const score = this.calculateScore(issues);
    return { analyzer: this.name, score, issues, recommendations: [] };
  }
}
