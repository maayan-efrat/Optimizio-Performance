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
  { name: 'Twitter/X Pixel',         patterns: ['static.ads-twitter.com', 'platform.twitter.com/oct.js'],                                    category: 'advertising',  gdprRisk: 'high' },
];

const CONSENT_PLATFORMS = [
  'cookiebot', 'cookieconsent', 'onetrust', 'quantcast', 'cookiefirst',
  'trustarc', 'usercentrics', 'didomi', 'iubenda', 'termly', 'osano',
];

export class PrivacyAnalyzer extends BaseAnalyzer {
  name = 'privacy';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';
    const lower = html.toLowerCase();

    // 1. Detect trackers
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

    // 2. Cookie consent banner
    const hasConsentPlatform = CONSENT_PLATFORMS.some(p => lower.includes(p));
    const hasCookieLanguage =
      (lower.includes('cookie') || lower.includes('consent')) &&
      (lower.includes('accept') || lower.includes('agree') || lower.includes('allow'));

    if (detectedTrackers.length > 0 && !hasConsentPlatform && !hasCookieLanguage) {
      issues.push({
        title: 'No cookie consent banner detected',
        severity: highRiskTrackers.length > 0 ? 'critical' : 'high',
        description: 'Trackers are present but no cookie consent mechanism was found.',
        whyItMatters: 'GDPR requires explicit consent before setting non-essential cookies. Operating without a consent banner while using tracking tools is a legal violation in the EU.',
        recommendation: 'Add a cookie consent management platform such as Cookiebot, OneTrust, or Iubenda. Configure it to block trackers until consent is given.',
        estimatedImpact: 'Legal compliance + user trust',
        details: `${detectedTrackers.length} tracker(s) found with no consent mechanism.`,
      });
    }

    // 3. Privacy Policy link
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
      });
    }

    // 4. HTTPS check (security overlap but relevant for privacy)
    if (!data.url.startsWith('https://')) {
      issues.push({
        title: 'Site not served over HTTPS',
        severity: 'critical',
        description: 'The page is served over HTTP — all data is transmitted in plain text.',
        whyItMatters: 'Without HTTPS, any data submitted via forms (including passwords and personal info) can be intercepted.',
        recommendation: 'Enable HTTPS via a free SSL certificate (Let\'s Encrypt) through your hosting provider.',
        estimatedImpact: '+15 points',
      });
    }

    // 5. Cookie set without Secure/SameSite (from HTML meta equiv cookies)
    const metaCookies = [...html.matchAll(/<meta[^>]+http-equiv=["']set-cookie["'][^>]*>/gi)];
    for (const [cookieTag] of metaCookies) {
      if (!cookieTag.toLowerCase().includes('secure') || !cookieTag.toLowerCase().includes('samesite')) {
        issues.push({
          title: 'Cookie set via meta tag without Secure/SameSite attributes',
          severity: 'medium',
          description: 'A cookie is being set via an HTML meta tag without proper security attributes.',
          whyItMatters: 'Cookies without Secure and SameSite=Lax/Strict are vulnerable to CSRF attacks and cross-site leakage.',
          recommendation: 'Set cookies server-side with: Set-Cookie: name=value; Secure; SameSite=Lax; HttpOnly',
          estimatedImpact: '+3 points',
        });
        break;
      }
    }

    return {
      analyzer: this.name,
      score: this.calculateScore(issues),
      issues,
      recommendations: [],
      metadata: {
        trackersDetected: detectedTrackers.map(t => t.name),
        hasConsentBanner: hasConsentPlatform || hasCookieLanguage,
        hasPrivacyPolicy,
      },
    };
  }
}
