import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

interface TrackerDef {
  name: string;
  patterns: string[];
  category: 'analytics' | 'advertising' | 'heatmap' | 'crm' | 'social';
  gdprRisk: 'high' | 'medium' | 'low';
}

const TRACKERS: TrackerDef[] = [
  { name: 'Google Analytics (GA4)',  patterns: ['google-analytics.com/g/collect', 'gtag/js?id=G-', 'googletagmanager.com/gtag'],             category: 'analytics',    gdprRisk: 'high' },
  { name: 'Google Analytics (UA)',   patterns: ['google-analytics.com/analytics.js', 'google-analytics.com/ga.js', "gtag('config', 'UA-"], category: 'analytics',    gdprRisk: 'high' },
  { name: 'Google Tag Manager',      patterns: ['googletagmanager.com/gtm.js', 'gtm.js?id=GTM-'],                                            category: 'analytics',    gdprRisk: 'medium' },
  { name: 'Facebook Pixel',          patterns: ['connect.facebook.net/en_US/fbevents.js', 'fbq(', 'facebook.com/tr?id='],                    category: 'advertising',  gdprRisk: 'high' },
  { name: 'Hotjar',                  patterns: ['hotjar.com/c/hotjar-', 'static.hotjar.com', 'hj(window,document'],                          category: 'heatmap',      gdprRisk: 'high' },
  { name: 'Mixpanel',                patterns: ['cdn.mxpnl.com', 'mixpanel.com/libs', 'mixpanel.init('],                                     category: 'analytics',    gdprRisk: 'medium' },
  { name: 'Intercom',                patterns: ['widget.intercom.io', 'js.intercom.io', 'app.intercom.io'],                                  category: 'crm',          gdprRisk: 'medium' },
  { name: 'LinkedIn Insight Tag',    patterns: ['snap.licdn.com', 'linkedin.com/li.lms-analytics'],                                          category: 'advertising',  gdprRisk: 'high' },
  { name: 'TikTok Pixel',            patterns: ['analytics.tiktok.com', 'business-api.tiktok.com'],                                          category: 'advertising',  gdprRisk: 'high' },
  { name: 'Microsoft Clarity',       patterns: ['clarity.ms/tag', 'clarity.ms/s/'],                                                          category: 'heatmap',      gdprRisk: 'medium' },
  { name: 'HubSpot',                 patterns: ['js.hsforms.net', 'js.hs-scripts.com', 'hs-analytics.net'],                                  category: 'crm',          gdprRisk: 'medium' },
  { name: 'Segment',                 patterns: ['cdn.segment.com', 'segment.io'],                                                             category: 'analytics',    gdprRisk: 'medium' },
  { name: 'Amplitude',               patterns: ['cdn.amplitude.com', 'api.amplitude.com'],                                                   category: 'analytics',    gdprRisk: 'medium' },
  { name: 'Crisp Chat',              patterns: ['client.crisp.chat', 'crisp.chat'],                                                           category: 'crm',          gdprRisk: 'low' },
  { name: 'Tawk.to',                 patterns: ['embed.tawk.to', 'tawk.to/s1/'],                                                             category: 'crm',          gdprRisk: 'low' },
  { name: 'Tidio',                   patterns: ['code.tidio.co', 'tidio.com/widget'],                                                        category: 'crm',          gdprRisk: 'low' },
  { name: 'Zendesk',                 patterns: ['static.zdassets.com', 'ekr.zdassets.com'],                                                  category: 'crm',          gdprRisk: 'medium' },
  { name: 'Twitter/X Pixel',         patterns: ['static.ads-twitter.com', 'platform.twitter.com/oct.js'],                                    category: 'advertising',  gdprRisk: 'high' },
  { name: 'Taboola',                 patterns: ['cdn.taboola.com', 'trc.taboola.com'],                                                       category: 'advertising',  gdprRisk: 'high' },
  { name: 'Outbrain',                patterns: ['amplify.outbrain.com', 'outbrain.com'],                                                     category: 'advertising',  gdprRisk: 'high' },
  { name: 'Facebook SDK',            patterns: ['connect.facebook.net/he_IL/sdk.js', 'connect.facebook.net/en_US/sdk.js'],                   category: 'social',       gdprRisk: 'high' },
  { name: 'Cloudflare Zaraz',        patterns: ['zaraz.js', 'cloudflare.com/zaraz', '/cdn-cgi/zaraz/'],                                      category: 'analytics',    gdprRisk: 'medium' },
  { name: 'Google reCAPTCHA',        patterns: ['recaptcha/api.js', 'recaptcha/api2', 'www.google.com/recaptcha'],                           category: 'analytics',    gdprRisk: 'medium' },
];

const CONSENT_PLATFORMS = [
  'cookiebot', 'cookieconsent', 'onetrust', 'quantcast', 'cookiefirst',
  'trustarc', 'usercentrics', 'didomi', 'iubenda', 'termly', 'osano',
  'cookieyes', 'cookie-yes', 'cookielaw', 'cookiepro', 'consentmanager',
];

const ANALYTICS_PATTERNS = [
  'google-analytics.com', 'gtag/js', 'googletagmanager.com/gtm.js',
  'segment.io', 'cdn.amplitude.com', 'cdn.mxpnl.com', 'matomo.js',
  'piwik.js', 'plausible.io', 'umami.is', 'clarity.ms',
];

export class PrivacyAnalyzer extends BaseAnalyzer {
  name = 'privacy';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';
    const lower = html.toLowerCase();
    const isDev = data.isDevelopment ?? false;

    // ── Detect trackers ──────────────────────────────────────────────────────
    const detectedTrackers: TrackerDef[] = [];
    for (const tracker of TRACKERS) {
      if (tracker.patterns.some(p => html.includes(p))) {
        detectedTrackers.push(tracker);
      }
    }

    const highRiskTrackers = detectedTrackers.filter(t => t.gdprRisk === 'high');

    if (highRiskTrackers.length > 0) {
      issues.push({
        title: `${highRiskTrackers.length} high-risk tracker(s) detected: ${highRiskTrackers.map(t => t.name).join(', ')}`,
        severity: 'high',
        description: `Trackers that collect personal data: ${highRiskTrackers.map(t => t.name).join(', ')}.`,
        whyItMatters: 'Under GDPR (EU), CCPA (California), and other privacy laws, these trackers require explicit user consent before loading. Violations can result in significant fines.',
        recommendation: 'Implement a cookie consent management platform (CMP) that blocks these trackers until user consent is obtained.',
        estimatedImpact: 'Legal compliance',
        businessImpact: 'ללא הסכמת המשתמש, הטמעת טרקרים כמו Facebook Pixel ו-Google Analytics מהווה הפרת GDPR — קנסות של עד €20 מיליון.',
        details: `Detected: ${highRiskTrackers.map(t => `${t.name} (${t.category}, risk: ${t.gdprRisk})`).join('; ')}`,
      });
    }

    const mediumRiskTrackers = detectedTrackers.filter(t => t.gdprRisk === 'medium');
    if (mediumRiskTrackers.length > 0) {
      issues.push({
        title: `${mediumRiskTrackers.length} analytics/CRM tool(s) found: ${mediumRiskTrackers.map(t => t.name).join(', ')}`,
        severity: 'medium',
        description: `These tools may process user data: ${mediumRiskTrackers.map(t => t.name).join(', ')}.`,
        whyItMatters: 'Even "functional" tracking tools should be disclosed in your Privacy Policy and may require consent under GDPR.',
        recommendation: 'Add these tools to your Privacy Policy and ensure they are covered by your consent mechanism.',
        estimatedImpact: 'Legal compliance',
      });
    }

    // ── Cookie consent banner (skip check in dev) ─────────────────────────────
    const hasConsentPlatform = CONSENT_PLATFORMS.some(p => lower.includes(p));
    const hasCookieLanguage =
      (lower.includes('cookie') || lower.includes('consent')) &&
      (lower.includes('accept') || lower.includes('agree') || lower.includes('allow'));

    if (!isDev && detectedTrackers.length > 0 && !hasConsentPlatform && !hasCookieLanguage) {
      issues.push({
        title: 'No cookie consent banner detected',
        severity: highRiskTrackers.length > 0 ? 'critical' : 'high',
        description: 'Trackers are present but no cookie consent mechanism was found.',
        whyItMatters: 'GDPR requires explicit consent before setting non-essential cookies. Operating without a consent banner while using tracking tools is a legal violation in the EU.',
        recommendation: 'Add a cookie consent management platform such as Cookiebot, OneTrust, or Iubenda. Configure it to block trackers until consent is given.',
        codeExample: '<!-- Cookiebot (free tier available) -->\n<script id="Cookiebot" src="https://consent.cookiebot.com/uc.js"\n  data-cbid="YOUR-COOKIEBOT-ID"\n  data-blockingmode="auto"\n  type="text/javascript">\n</script>',
        estimatedImpact: 'Legal compliance + user trust',
        businessImpact: 'ללא banner הסכמה לעוגיות, האתר מפר GDPR ונחשף לתלונות ו/או קנסות.',
        details: `${detectedTrackers.length} tracker(s) found with no consent mechanism.`,
      });
    }

    // ── Privacy Policy link ───────────────────────────────────────────────────
    const hasPrivacyPolicy =
      lower.includes('privacy-policy') ||
      lower.includes('privacy policy') ||
      lower.includes('פרטיות') ||
      lower.includes('מדיניות פרטיות') ||
      /<a[^>]+href[^>]+>[^<]*(privacy|פרטיות)[^<]*<\/a>/i.test(html);

    if (!hasPrivacyPolicy) {
      issues.push({
        title: 'No Privacy Policy link found',
        severity: 'high',
        description: 'No link to a Privacy Policy page was detected on this page.',
        whyItMatters: 'A publicly accessible Privacy Policy is legally required in most jurisdictions (GDPR, CalOPPA, CCPA) if you collect any user data.',
        recommendation: 'Add a visible link to your Privacy Policy in the footer of every page.',
        estimatedImpact: 'Legal compliance',
        businessImpact: 'היעדר מדיניות פרטיות עלול לגרום לקנסות ופגיעה באמון לקוחות.',
      });
    }

    // ── YouTube embeds without privacy mode ───────────────────────────────────
    const ytEmbeds = [...html.matchAll(/(?:src|data-src)=["']([^"']*(?:youtube\.com\/embed|youtu\.be\/)[^"']*)["']/gi)].map(m => m[1]);
    const ytNonPrivacy = ytEmbeds.filter(src => !src.includes('youtube-nocookie.com'));
    if (ytNonPrivacy.length > 0) {
      issues.push({
        title: `${ytNonPrivacy.length} YouTube embed(s) without Privacy Enhanced mode`,
        severity: 'medium',
        description: `${ytNonPrivacy.length} YouTube iframe(s) use youtube.com instead of youtube-nocookie.com.`,
        whyItMatters: 'Standard YouTube embeds set tracking cookies from Google/YouTube on your visitors before they ever interact with the video — no consent needed from YouTube\'s perspective but required under GDPR.',
        recommendation: 'Replace youtube.com with youtube-nocookie.com in all embed URLs.',
        codeExample: '<!-- Before (tracks users immediately): -->\n<iframe src="https://www.youtube.com/embed/VIDEO_ID"></iframe>\n\n<!-- After (Privacy Enhanced Mode): -->\n<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID"></iframe>',
        estimatedImpact: 'Privacy compliance',
        businessImpact: 'YouTube embeds רגילים מגדירים עוגיות מעקב של Google ללא הסכמת המשתמש — מפר GDPR.',
        affectedUrls: ytNonPrivacy.slice(0, 5),
      });
    }

    // ── Google Fonts from googleapis.com ─────────────────────────────────────
    const googleFontsLinks = [...html.matchAll(/<link[^>]+href=["']([^"']*fonts\.googleapis\.com[^"']*)["'][^>]*>/gi)].map(m => m[1]);
    if (googleFontsLinks.length > 0) {
      issues.push({
        title: `${googleFontsLinks.length} Google Fonts request(s) via googleapis.com`,
        severity: 'low',
        description: `Page loads fonts from fonts.googleapis.com — sends visitors' IP addresses to Google servers.`,
        whyItMatters: 'Loading fonts from Google servers exposes visitor IP addresses to Google. Under GDPR this constitutes a data transfer requiring disclosure (and potentially consent). German DPA has fined sites for this.',
        recommendation: 'Self-host Google Fonts: download them from fonts.google.com, serve from your own domain.',
        codeExample: '<!-- Remove: -->\n<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">\n\n<!-- Add to CSS instead (self-hosted): -->\n@font-face {\n  font-family: \'Inter\';\n  src: url(\'/fonts/inter.woff2\') format(\'woff2\');\n  font-display: swap;\n}',
        estimatedImpact: 'Privacy compliance + performance',
        businessImpact: 'Google Fonts מגרסמאפיס שולח כתובות IP של מבקרים לגוגל — הופך את האתר לאחראי להעברת נתונים אישיים.',
        affectedUrls: googleFontsLinks.slice(0, 5),
      });
    }

    // ── Facebook SDK ──────────────────────────────────────────────────────────
    const hasFbSdk = /connect\.facebook\.net\/(?:he_IL|en_US)\/sdk\.js/i.test(html);
    if (hasFbSdk && !hasConsentPlatform && !hasCookieLanguage) {
      issues.push({
        title: 'Facebook SDK loaded without consent gate',
        severity: 'medium',
        description: 'The Facebook JS SDK is loaded unconditionally — it sets tracking cookies before any user consent.',
        whyItMatters: 'Facebook SDK sets _fbp cookie immediately on page load and sends data to Meta. This requires explicit GDPR consent.',
        recommendation: 'Load the Facebook SDK only after the user consents via your cookie consent platform. Use your CMP to conditionally inject it.',
        estimatedImpact: 'Privacy compliance',
      });
    }

    // ── HTTPS check ───────────────────────────────────────────────────────────
    if (!isDev && !data.url.startsWith('https://')) {
      issues.push({
        title: 'Site not served over HTTPS',
        severity: 'critical',
        description: 'The page is served over HTTP — all data is transmitted in plain text.',
        whyItMatters: 'Without HTTPS, any data submitted via forms (including passwords and personal info) can be intercepted.',
        recommendation: "Enable HTTPS via a free SSL certificate (Let's Encrypt) through your hosting provider.",
        estimatedImpact: '+15 points',
      });
    }

    // ── Cookie set without Secure/SameSite (from HTML meta equiv cookies) ────
    const metaCookies = [...html.matchAll(/<meta[^>]+http-equiv=["']set-cookie["'][^>]*>/gi)];
    for (const [cookieTag] of metaCookies) {
      if (!cookieTag.toLowerCase().includes('secure') || !cookieTag.toLowerCase().includes('samesite')) {
        issues.push({
          title: 'Cookie set via meta tag without Secure/SameSite attributes',
          severity: 'medium',
          description: 'A cookie is being set via an HTML meta tag without proper security attributes.',
          whyItMatters: 'Cookies without Secure and SameSite=Lax/Strict are vulnerable to CSRF attacks and cross-site leakage.',
          recommendation: 'Set cookies server-side with: Set-Cookie: name=value; Secure; SameSite=Lax; HttpOnly',
          codeExample: 'Set-Cookie: session=abc123; Secure; HttpOnly; SameSite=Lax; Path=/',
          estimatedImpact: '+3 points',
        });
        break;
      }
    }

    // ── Analytics detection (informational) ──────────────────────────────────
    const hasAnalytics = ANALYTICS_PATTERNS.some(p => html.includes(p));

    return {
      analyzer: this.name,
      score: this.calculateScore(issues),
      issues,
      recommendations: [],
      metadata: {
        trackersDetected: detectedTrackers.map(t => t.name),
        trackerCount: detectedTrackers.length,
        highRiskCount: highRiskTrackers.length,
        hasConsentBanner: hasConsentPlatform || hasCookieLanguage,
        hasPrivacyPolicy,
        hasAnalytics,
        youtubeEmbeds: ytEmbeds.length,
        youtubeNonPrivacy: ytNonPrivacy.length,
        googleFontsExternal: googleFontsLinks.length,
        isDevelopment: isDev,
      },
    };
  }
}
