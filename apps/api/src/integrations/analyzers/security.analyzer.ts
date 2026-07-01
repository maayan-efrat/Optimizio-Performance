import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

const CDN_DOMAINS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com', 'cdn.skypack.dev', 'esm.sh'];

export class SecurityAnalyzer extends BaseAnalyzer {
  name = 'security';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';
    const headers = data.responseHeaders || {};
    const isDev = data.isDevelopment ?? false;

    const h = (name: string) => headers[name.toLowerCase()] || '';

    // ── Exposed sensitive files (production only — already probed in scan-engine) ──
    if (!isDev && data.exposedPaths && data.exposedPaths.length > 0) {
      issues.push({
        title: `${data.exposedPaths.length} sensitive file(s) publicly accessible`,
        severity: 'critical',
        description: `These files returned HTTP 200 and should never be publicly accessible: ${data.exposedPaths.join(', ')}`,
        whyItMatters: 'Exposed configuration files, database dumps and source control files can leak credentials, API keys, database passwords and server configuration to attackers.',
        recommendation: 'Immediately block access to these paths via your web server configuration, move secret files above the web root, or add them to .gitignore and delete from the server.',
        codeExample: '# In nginx.conf:\nlocation ~* /\\.env|\\.git|backup\\.sql|config\\.php {\n  deny all;\n  return 404;\n}\n\n# In .htaccess (Apache):\n<FilesMatch "(\\.env|\\.git|backup|config\\.php)">\n  Order allow,deny\n  Deny from all\n</FilesMatch>',
        estimatedImpact: '+30 points',
        businessImpact: 'קבצי תצורה חשופים מאפשרים לתוקפים לגנוב מפתחות API, סיסמאות מסד הנתונים ולהשתלט על האתר.',
        difficulty: 'easy',
        fixTime: '30 דקות',
        affectedUrls: data.exposedPaths.map(p => `${new URL(data.url).origin}${p}`),
        details: `Exposed paths: ${data.exposedPaths.join(', ')}`,
      });
    }

    // ── HTTPS (skip in dev) ───────────────────────────────────────────────────
    if (!isDev && !data.url.startsWith('https://')) {
      issues.push({
        title: 'Site does not use HTTPS',
        severity: 'critical',
        description: `The scanned URL uses HTTP: ${data.url}`,
        whyItMatters: 'HTTP transmits data in plaintext — passwords, form inputs, and cookies are exposed to interception.',
        recommendation: "Install an SSL/TLS certificate (free via Let's Encrypt) and redirect HTTP → HTTPS permanently.",
        codeExample: "# Certbot (Let's Encrypt — free SSL):\nsudo certbot --nginx -d yourdomain.com -d www.yourdomain.com",
        estimatedImpact: '+20 points',
        businessImpact: 'Google מוריד דירוג לאתרים ב-HTTP ו-Chrome מציג "לא מאובטח" — לקוחות בורחים.',
        difficulty: 'easy',
        fixTime: '1 שעה',
        details: 'Google marks HTTP sites as "Not Secure" in Chrome since 2018.',
      });
    }

    // ── HTTP → HTTPS redirect (skip in dev) ───────────────────────────────────
    if (!isDev && data.url.startsWith('https://') && data.httpRedirectsToHttps === false) {
      issues.push({
        title: 'HTTP version does not redirect to HTTPS',
        severity: 'high',
        description: `Visiting http://${new URL(data.url).hostname} does not redirect to the HTTPS version.`,
        whyItMatters: 'Users who type the URL without https:// land on an insecure HTTP version.',
        recommendation: 'Add a 301 redirect from http:// to https:// at the server or CDN level.',
        codeExample: '# In nginx.conf:\nserver {\n  listen 80;\n  server_name yourdomain.com www.yourdomain.com;\n  return 301 https://$host$request_uri;\n}',
        estimatedImpact: '+6 points',
        details: 'HTTP → HTTPS redirect is expected for all HTTPS sites.',
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

    // ── HSTS (skip in dev) ────────────────────────────────────────────────────
    if (!isDev && !h('strict-transport-security')) {
      issues.push({
        title: 'Missing Strict-Transport-Security (HSTS) header',
        severity: 'high',
        description: 'The server does not return a Strict-Transport-Security header.',
        whyItMatters: 'Without HSTS, browsers may load the site over HTTP, enabling man-in-the-middle attacks.',
        recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        codeExample: '# In nginx.conf:\nadd_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;',
        estimatedImpact: '+8 points',
        details: 'HSTS tells browsers to always use HTTPS — prevents SSL stripping attacks.',
      });
    }

    // ── Content-Security-Policy (skip missing-CSP in dev) ────────────────────
    const csp = h('content-security-policy');
    if (!csp) {
      if (!isDev) {
        issues.push({
          title: 'Missing Content-Security-Policy (CSP) header',
          severity: 'high',
          description: 'No CSP header returned by the server.',
          whyItMatters: 'Without CSP, the site is vulnerable to cross-site scripting (XSS) attacks — the most common web vulnerability.',
          recommendation: "Add a Content-Security-Policy header. Start with: default-src 'self'; script-src 'self'",
          codeExample: "# In nginx.conf:\nadd_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'nonce-{RANDOM}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';\" always;",
          estimatedImpact: '+8 points',
          details: 'CSP whitelists which sources can load scripts, styles, fonts and media.',
        });
      }
    } else {
      // Check for unsafe-inline/unsafe-eval specifically in script-src (not just style-src).
      // 'unsafe-inline' in style-src only is much less dangerous (no JS execution).
      const scriptSrcMatch = csp.match(/script-src\s+([^;]+)/i);
      const scriptSrc = scriptSrcMatch?.[1] ?? '';
      const hasUnsafeInlineScript = scriptSrc.includes("'unsafe-inline'");
      const hasUnsafeEval = csp.includes("'unsafe-eval'");

      if (hasUnsafeInlineScript || hasUnsafeEval) {
        const flagged = [hasUnsafeInlineScript && "'unsafe-inline' in script-src", hasUnsafeEval && "'unsafe-eval'"].filter(Boolean).join(', ');
        issues.push({
          title: `CSP uses ${flagged}`,
          severity: 'medium',
          description: `Current CSP script-src contains: ${flagged}`,
          whyItMatters: "unsafe-inline and unsafe-eval in script-src defeat the purpose of CSP — XSS injection is still possible.",
          recommendation: "Use nonces or hashes instead of 'unsafe-inline'. Move dynamic code to avoid 'unsafe-eval'.",
          codeExample: "# Replace 'unsafe-inline' with nonces:\nContent-Security-Policy: script-src 'self' 'nonce-{RANDOM}' 'strict-dynamic';\n\n# Each inline script gets the nonce:\n<script nonce=\"{RANDOM}\">...</script>",
          estimatedImpact: '+4 points',
          details: `script-src: ${scriptSrc.slice(0, 120)}`,
        });
      }
    }

    // ── Cross-Origin headers (CORP / COEP / COOP) ─────────────────────────────
    const corp = h('cross-origin-resource-policy');
    const coep = h('cross-origin-embedder-policy');
    const coop = h('cross-origin-opener-policy');

    if (!corp) {
      issues.push({
        title: 'Missing Cross-Origin-Resource-Policy (CORP) header',
        severity: 'low',
        description: 'No Cross-Origin-Resource-Policy header found.',
        whyItMatters: 'Without CORP, the site\'s resources can be loaded by any cross-origin page, enabling Spectre-style side-channel attacks.',
        recommendation: 'Add: Cross-Origin-Resource-Policy: same-origin  (or same-site for resources shared with partner sites)',
        codeExample: 'add_header Cross-Origin-Resource-Policy "same-origin" always;',
        estimatedImpact: '+2 points',
      });
    }

    if (!coep) {
      issues.push({
        title: 'Missing Cross-Origin-Embedder-Policy (COEP) header',
        severity: 'low',
        description: 'No Cross-Origin-Embedder-Policy header found.',
        whyItMatters: 'COEP is required to enable high-resolution timers, SharedArrayBuffer and other modern APIs securely. Without it, your site cannot opt into cross-origin isolation.',
        recommendation: 'Add: Cross-Origin-Embedder-Policy: require-corp  (only after setting CORP on all resources)',
        codeExample: 'add_header Cross-Origin-Embedder-Policy "require-corp" always;',
        estimatedImpact: '+2 points',
      });
    }

    if (!coop) {
      issues.push({
        title: 'Missing Cross-Origin-Opener-Policy (COOP) header',
        severity: 'low',
        description: 'No Cross-Origin-Opener-Policy header found.',
        whyItMatters: 'Without COOP, cross-origin pages can access your window object, enabling XS-Leaks and other side-channel attacks.',
        recommendation: 'Add: Cross-Origin-Opener-Policy: same-origin',
        codeExample: 'add_header Cross-Origin-Opener-Policy "same-origin" always;',
        estimatedImpact: '+2 points',
      });
    }

    // ── Subresource Integrity (SRI) ───────────────────────────────────────────
    const externalScriptTags = [...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    const cdnScriptsWithoutSri = externalScriptTags.filter(m => {
      const src = m[1];
      const tag = m[0];
      return CDN_DOMAINS.some(cdn => src.includes(cdn)) && !tag.includes('integrity=');
    });
    if (cdnScriptsWithoutSri.length > 0) {
      issues.push({
        title: `${cdnScriptsWithoutSri.length} CDN script(s) missing Subresource Integrity (SRI)`,
        severity: 'medium',
        description: `${cdnScriptsWithoutSri.length} external scripts from CDNs are loaded without integrity= attribute.`,
        whyItMatters: 'If a CDN is compromised, attackers can inject malicious code into your site. SRI blocks tampered files.',
        recommendation: 'Add integrity="sha384-..." and crossorigin="anonymous" to each CDN script. Use srihash.org to generate hashes.',
        codeExample: '<script\n  src="https://cdn.jsdelivr.net/npm/package@version/dist/file.min.js"\n  integrity="sha384-[HASH]"\n  crossorigin="anonymous"\n></script>',
        estimatedImpact: '+4 points',
        affectedUrls: cdnScriptsWithoutSri.map(m => m[1]).slice(0, 10),
        details: `CDN scripts without SRI: ${cdnScriptsWithoutSri.map(m => m[1].split('/').pop()).slice(0, 3).join(', ')}`,
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
        codeExample: "add_header X-Frame-Options \"SAMEORIGIN\" always;\n# Or via CSP (preferred):\nadd_header Content-Security-Policy \"frame-ancestors 'self'\" always;",
        estimatedImpact: '+5 points',
      });
    }

    // ── iframe sandbox ────────────────────────────────────────────────────────
    const iframeTags = [...html.matchAll(/<iframe[^>]*>/gi)];
    const unsandboxedIframes = iframeTags.filter(m => !m[0].includes('sandbox'));
    if (unsandboxedIframes.length > 0) {
      issues.push({
        title: `${unsandboxedIframes.length} iframe(s) without sandbox attribute`,
        severity: 'medium',
        description: `${unsandboxedIframes.length} <iframe> elements lack the sandbox attribute.`,
        whyItMatters: 'Unsandboxed iframes can run scripts, submit forms, and navigate the top-level window.',
        recommendation: 'Add sandbox="allow-scripts allow-same-origin" (adjust permissions as needed) to all iframes.',
        codeExample: '<iframe\n  src="https://example.com/embed"\n  sandbox="allow-scripts allow-same-origin"\n  loading="lazy"\n></iframe>',
        estimatedImpact: '+3 points',
        details: `Found ${iframeTags.length} total iframes, ${unsandboxedIframes.length} unsandboxed.`,
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
        codeExample: 'add_header X-Content-Type-Options "nosniff" always;',
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
        codeExample: 'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
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
        codeExample: 'add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self), payment=()" always;',
        estimatedImpact: '+2 points',
      });
    }

    // ── Cookie security flags ─────────────────────────────────────────────────
    const setCookieRaw = headers['set-cookie'] || '';
    if (setCookieRaw) {
      const cookieParts = setCookieRaw.split(',').map(s => s.trim());
      const missingSecure   = cookieParts.filter(c => !/;\s*Secure/i.test(c));
      const missingHttpOnly = cookieParts.filter(c => !/;\s*HttpOnly/i.test(c));
      const missingSameSite = cookieParts.filter(c => !/;\s*SameSite/i.test(c));

      if (missingSecure.length > 0 && data.url.startsWith('https://')) {
        issues.push({
          title: `${missingSecure.length} cookie(s) missing Secure flag`,
          severity: 'medium',
          description: 'One or more cookies are set without the Secure flag.',
          whyItMatters: 'Cookies without Secure can be transmitted over HTTP, exposing session tokens.',
          recommendation: 'Add the Secure attribute to all cookies: Set-Cookie: session=...; Secure; HttpOnly',
          codeExample: 'Set-Cookie: session=abc123; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400',
          estimatedImpact: '+4 points',
        });
      }
      if (missingHttpOnly.length > 0) {
        issues.push({
          title: `${missingHttpOnly.length} cookie(s) missing HttpOnly flag`,
          severity: 'medium',
          description: 'Cookies without HttpOnly are accessible via JavaScript — XSS can steal them.',
          whyItMatters: 'HttpOnly cookies cannot be read by client-side scripts, making XSS-based session theft impossible.',
          recommendation: 'Add HttpOnly to all session and authentication cookies.',
          codeExample: 'Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Strict',
          estimatedImpact: '+4 points',
        });
      }
      if (missingSameSite.length > 0) {
        issues.push({
          title: `${missingSameSite.length} cookie(s) missing SameSite flag`,
          severity: 'low',
          description: 'Cookies without SameSite attribute may be sent in cross-site requests (CSRF risk).',
          whyItMatters: 'SameSite=Lax or Strict prevents cookies from being sent in cross-site requests, blocking CSRF attacks.',
          recommendation: 'Add SameSite=Lax to most cookies, SameSite=Strict for critical session cookies.',
          estimatedImpact: '+2 points',
        });
      }
    }

    // ── CORS header checks ────────────────────────────────────────────────────
    const acao = h('access-control-allow-origin');
    if (acao === '*') {
      issues.push({
        title: 'CORS allows any origin (Access-Control-Allow-Origin: *)',
        severity: 'medium',
        description: 'The server sends Access-Control-Allow-Origin: * — any website can make cross-origin requests to your endpoints.',
        whyItMatters: 'An overly permissive CORS policy allows malicious websites to call your API endpoints in the context of your users\' browsers, potentially leaking data.',
        recommendation: 'Restrict CORS to trusted origins: Access-Control-Allow-Origin: https://yourdomain.com',
        codeExample: 'add_header Access-Control-Allow-Origin "https://yourdomain.com" always;\nadd_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;\nadd_header Access-Control-Allow-Headers "Authorization, Content-Type" always;',
        estimatedImpact: '+4 points',
        details: 'The wildcard (*) should only be used for truly public APIs.',
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
        codeExample: '# In nginx.conf:\nserver_tokens off;\n\n# In Apache .htaccess:\nServerTokens Prod\nServerSignature Off',
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
        codeExample: '// Express.js:\napp.disable("x-powered-by");\n\n// Or via nginx:\nproxy_hide_header X-Powered-By;',
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
        codeExample: '<form action="https://yoursite.com/contact" method="POST">\n  <!-- form fields -->\n</form>',
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
      h('cross-origin-resource-policy') && 'CORP',
      h('cross-origin-embedder-policy') && 'COEP',
      h('cross-origin-opener-policy') && 'COOP',
    ].filter(Boolean) as string[];

    const score = this.calculateScore(issues);
    return {
      analyzer: this.name,
      score,
      issues,
      recommendations: [],
      metadata: {
        isHttps: data.url.startsWith('https://'),
        httpRedirectsToHttps: data.httpRedirectsToHttps ?? null,
        presentSecurityHeaders: presentHeaders,
        missingHeaderCount: 9 - presentHeaders.length,
        serverHeader: serverHeader || null,
        xPoweredBy: xPoweredBy || null,
        inlineScripts,
        hasCsp: !!csp,
        cspHasUnsafeInline: csp.includes("'unsafe-inline'"),
        cdnScriptsWithoutSri: cdnScriptsWithoutSri.length,
        hasCookies: !!setCookieRaw,
        corsAllowsAll: acao === '*',
        exposedPaths: data.exposedPaths ?? [],
        isDevelopment: isDev,
      },
    };
  }
}
