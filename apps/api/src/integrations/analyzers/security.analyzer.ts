import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

export class SecurityAnalyzer extends BaseAnalyzer {
  name = 'security';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';
    const headers = data.responseHeaders || {};

    const h = (name: string) => headers[name.toLowerCase()] || '';

    // ── HTTPS ─────────────────────────────────────────────────────────────────
    if (!data.url.startsWith('https://')) {
      issues.push({
        title: 'Site does not use HTTPS',
        severity: 'critical',
        description: `The scanned URL uses HTTP: ${data.url}`,
        whyItMatters: 'HTTP transmits data in plaintext — passwords, form inputs, and cookies are exposed to interception.',
        recommendation: "Install an SSL/TLS certificate (free via Let's Encrypt) and redirect HTTP → HTTPS permanently.",
        estimatedImpact: '+20 points',
        details: 'Google marks HTTP sites as "Not Secure" in Chrome since 2018.',
      });
    }

    // ── Mixed content (HTTP resources on HTTPS page) ───────────────────────────
    if (data.url.startsWith('https://')) {
      const httpResources = [
        ...html.matchAll(/(?:src|href|action|data-src)=["'](http:\/\/[^"'\s>]+)["']/gi)
      ].map(m => m[1]);
      const uniqueHttp = [...new Set(httpResources)];
      if (uniqueHttp.length > 0) {
        issues.push({
          title: `Mixed content — ${uniqueHttp.length} HTTP resource(s) on HTTPS page`,
          severity: 'high',
          description: 'HTTPS page loads resources over plain HTTP, which browsers block or warn about.',
          whyItMatters: 'Mixed content triggers security warnings and blocks resources in modern browsers, breaking functionality.',
          recommendation: 'Update all resource URLs to use https:// or protocol-relative paths (//).',
          estimatedImpact: '+8 points',
          affectedUrls: uniqueHttp.slice(0, 10),
          details: `HTTP resources found: ${uniqueHttp.slice(0, 3).join(', ')}`,
        });
      }
    }

    // ── HSTS ──────────────────────────────────────────────────────────────────
    if (!h('strict-transport-security')) {
      issues.push({
        title: 'Missing Strict-Transport-Security (HSTS) header',
        severity: 'high',
        description: 'The server does not return a Strict-Transport-Security header.',
        whyItMatters: 'Without HSTS, browsers may load the site over HTTP, enabling man-in-the-middle attacks.',
        recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        estimatedImpact: '+8 points',
        details: 'HSTS tells browsers to always use HTTPS — prevents SSL stripping attacks.',
      });
    }

    // ── Content-Security-Policy ───────────────────────────────────────────────
    const csp = h('content-security-policy');
    if (!csp) {
      issues.push({
        title: 'Missing Content-Security-Policy (CSP) header',
        severity: 'high',
        description: 'No CSP header returned by the server.',
        whyItMatters: 'Without CSP, the site is vulnerable to cross-site scripting (XSS) attacks — the most common web vulnerability.',
        recommendation: "Add a Content-Security-Policy header. Start with: default-src 'self'; script-src 'self'",
        estimatedImpact: '+8 points',
        details: 'CSP whitelists which sources can load scripts, styles, fonts and media.',
      });
    } else if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")) {
      issues.push({
        title: "CSP uses unsafe-inline or unsafe-eval",
        severity: 'medium',
        description: `Current CSP contains: ${[csp.includes("'unsafe-inline'") && "'unsafe-inline'", csp.includes("'unsafe-eval'") && "'unsafe-eval'"].filter(Boolean).join(', ')}`,
        whyItMatters: "unsafe-inline/unsafe-eval defeats the purpose of CSP — XSS is still possible.",
        recommendation: "Move inline scripts to external files and use nonces or hashes instead of 'unsafe-inline'.",
        estimatedImpact: '+4 points',
        details: `CSP: ${csp.slice(0, 120)}...`,
      });
    }

    // ── X-Frame-Options ───────────────────────────────────────────────────────
    if (!h('x-frame-options') && !csp.includes('frame-ancestors')) {
      issues.push({
        title: 'Missing X-Frame-Options header (clickjacking risk)',
        severity: 'medium',
        description: 'Site can be embedded in an <iframe> on any domain.',
        whyItMatters: 'Attackers can overlay transparent frames to trick users into clicking (clickjacking).',
        recommendation: 'Add: X-Frame-Options: SAMEORIGIN  (or set CSP frame-ancestors)',
        estimatedImpact: '+5 points',
      });
    }

    // ── X-Content-Type-Options ────────────────────────────────────────────────
    if (!h('x-content-type-options')) {
      issues.push({
        title: 'Missing X-Content-Type-Options header',
        severity: 'medium',
        description: 'Server does not send X-Content-Type-Options: nosniff.',
        whyItMatters: "Without it, browsers may 'sniff' file types, enabling MIME-confusion attacks.",
        recommendation: 'Add: X-Content-Type-Options: nosniff',
        estimatedImpact: '+4 points',
      });
    }

    // ── Referrer-Policy ───────────────────────────────────────────────────────
    if (!h('referrer-policy')) {
      issues.push({
        title: 'Missing Referrer-Policy header',
        severity: 'low',
        description: 'No Referrer-Policy header found.',
        whyItMatters: 'Without it, the full URL may be sent as Referer to third parties, leaking user paths and query params.',
        recommendation: 'Add: Referrer-Policy: strict-origin-when-cross-origin',
        estimatedImpact: '+2 points',
      });
    }

    // ── Permissions-Policy ────────────────────────────────────────────────────
    if (!h('permissions-policy')) {
      issues.push({
        title: 'Missing Permissions-Policy header',
        severity: 'low',
        description: 'No Permissions-Policy header found.',
        whyItMatters: "Without it, third-party iframes and scripts can access the user's camera, microphone and geolocation.",
        recommendation: 'Add: Permissions-Policy: camera=(), microphone=(), geolocation=(self)',
        estimatedImpact: '+2 points',
      });
    }

    // ── Server header leak ────────────────────────────────────────────────────
    const serverHeader = h('server');
    const xPoweredBy = h('x-powered-by');
    if (serverHeader && /\d/.test(serverHeader)) {
      issues.push({
        title: `Server version exposed: "${serverHeader}"`,
        severity: 'medium',
        description: `The Server response header reveals technology and version: ${serverHeader}`,
        whyItMatters: 'Exposing server version helps attackers target known CVEs for that exact version.',
        recommendation: 'Configure your web server to send a generic Server header or remove it entirely.',
        estimatedImpact: '+4 points',
        details: `Server: ${serverHeader}`,
      });
    }
    if (xPoweredBy) {
      issues.push({
        title: `X-Powered-By header leaks stack: "${xPoweredBy}"`,
        severity: 'low',
        description: `The X-Powered-By header reveals your tech stack: ${xPoweredBy}`,
        whyItMatters: 'Knowing your framework version helps attackers target known vulnerabilities.',
        recommendation: 'Remove or suppress the X-Powered-By header (e.g., in Express: app.disable("x-powered-by")).',
        estimatedImpact: '+2 points',
        details: `X-Powered-By: ${xPoweredBy}`,
      });
    }

    // ── Inline scripts (XSS surface) ──────────────────────────────────────────
    const inlineScripts = (html.match(/<script(?![^>]+src)[^>]*>[^<]{50,}/g) || []).length;
    if (inlineScripts > 3) {
      issues.push({
        title: `${inlineScripts} inline <script> blocks detected`,
        severity: 'low',
        description: `Found ${inlineScripts} substantial inline script blocks.`,
        whyItMatters: 'Inline scripts expand XSS attack surface and prevent strict CSP policies.',
        recommendation: 'Move scripts to external files to enable a strict Content-Security-Policy.',
        estimatedImpact: '+3 points',
        details: 'Inline scripts require unsafe-inline in CSP, which weakens XSS protection.',
      });
    }

    // ── Form security ─────────────────────────────────────────────────────────
    const formActions = [...html.matchAll(/<form[^>]+action=["'](http:\/\/[^"']+)["']/gi)].map(m => m[1]);
    if (formActions.length > 0) {
      issues.push({
        title: `${formActions.length} form(s) submitting to HTTP endpoints`,
        severity: 'critical',
        description: 'Form data is submitted over plain HTTP, exposing user input to interception.',
        whyItMatters: 'Form submissions over HTTP expose passwords, emails and personal data in plaintext.',
        recommendation: 'Change all form action URLs to use https://',
        estimatedImpact: '+15 points',
        affectedUrls: formActions,
      });
    }

    const presentHeaders = [
      h('strict-transport-security') && 'HSTS',
      h('content-security-policy') && 'CSP',
      h('x-frame-options') && 'X-Frame-Options',
      h('x-content-type-options') && 'X-Content-Type-Options',
      h('referrer-policy') && 'Referrer-Policy',
      h('permissions-policy') && 'Permissions-Policy',
    ].filter(Boolean) as string[];

    const score = this.calculateScore(issues);
    return {
      analyzer: this.name,
      score,
      issues,
      recommendations: [],
      metadata: {
        isHttps: data.url.startsWith('https://'),
        presentSecurityHeaders: presentHeaders,
        missingHeaderCount: 6 - presentHeaders.length,
        serverHeader: serverHeader || null,
        xPoweredBy: xPoweredBy || null,
        inlineScripts,
        hasCsp: !!csp,
        cspHasUnsafeInline: csp.includes("'unsafe-inline'"),
      },
    };
  }
}
