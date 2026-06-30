import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

export class MobileAnalyzer extends BaseAnalyzer {
  name = 'mobile';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';

    // 1. Viewport meta — presence
    const viewportMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']viewport["']/i);

    if (!viewportMatch) {
      issues.push({
        title: 'Missing viewport meta tag',
        severity: 'critical',
        description: 'No <meta name="viewport"> found.',
        whyItMatters: 'Without a viewport tag mobile browsers render the desktop layout scaled down — content is unreadable.',
        recommendation: 'Add to <head>: <meta name="viewport" content="width=device-width, initial-scale=1">',
        estimatedImpact: '+15 points',
      });
    } else {
      const viewportContent = viewportMatch[1];

      // 2. user-scalable=no — accessibility violation
      if (/user-scalable\s*=\s*no/i.test(viewportContent)) {
        issues.push({
          title: 'Viewport disables user zoom (user-scalable=no)',
          severity: 'high',
          description: `Viewport contains "user-scalable=no": ${viewportContent}`,
          whyItMatters: 'Preventing zoom is an accessibility violation and violates WCAG 2.1 SC 1.4.4. Google also penalizes this.',
          recommendation: 'Remove "user-scalable=no" and "maximum-scale=1" from your viewport meta tag.',
          estimatedImpact: '+8 points',
        });
      }

      // 3. maximum-scale=1 also prevents zoom
      if (/maximum-scale\s*=\s*1(?:\.0)?[^0-9]/i.test(viewportContent) && !/user-scalable\s*=\s*no/i.test(viewportContent)) {
        issues.push({
          title: 'Viewport restricts zoom (maximum-scale=1)',
          severity: 'medium',
          description: `Viewport contains "maximum-scale=1": ${viewportContent}`,
          whyItMatters: 'Restricting zoom prevents visually impaired users from reading content.',
          recommendation: 'Set maximum-scale to at least 5 or remove it entirely.',
          estimatedImpact: '+4 points',
        });
      }
    }

    // 4. Fixed-width elements in inline styles (overflow risk)
    const fixedWidthMatches = [...html.matchAll(/style=["'][^"']*width\s*:\s*(\d+)px[^"']*["']/gi)];
    const oversized = fixedWidthMatches.filter(m => parseInt(m[1], 10) > 600);
    if (oversized.length > 2) {
      issues.push({
        title: `${oversized.length} elements with fixed pixel width > 600px`,
        severity: 'medium',
        description: `Found ${oversized.length} inline styles with fixed widths exceeding 600px, which cause horizontal scrolling on mobile.`,
        whyItMatters: 'Fixed-width elements wider than the screen viewport force users to scroll horizontally — a poor mobile experience.',
        recommendation: 'Replace fixed pixel widths with responsive units: max-width: 100%, width: 100%, or CSS Grid/Flexbox.',
        estimatedImpact: '+5-8 points',
      });
    }

    // 5. Small font sizes in inline styles
    const fontSizeMatches = [...html.matchAll(/style=["'][^"']*font-size\s*:\s*(\d+(?:\.\d+)?)px[^"']*["']/gi)];
    const tinyFonts = fontSizeMatches.filter(m => parseFloat(m[1]) < 12);
    if (tinyFonts.length > 0) {
      issues.push({
        title: `${tinyFonts.length} element(s) with font-size < 12px`,
        severity: 'medium',
        description: `Found inline styles with font sizes below 12px.`,
        whyItMatters: 'Text below 12px is unreadable on mobile without zooming. Google recommends a minimum of 16px for body text.',
        recommendation: 'Use a minimum font-size of 14px (16px preferred) for readable body text on mobile.',
        estimatedImpact: '+3-5 points',
      });
    }

    // 6. Touch targets — count buttons and links with suspiciously small inline sizes
    const smallTargets = [...html.matchAll(/<(?:button|a)[^>]+style=["'][^"']*(?:width|height)\s*:\s*([1-3]\d)px[^"']*["']/gi)];
    if (smallTargets.length > 0) {
      issues.push({
        title: `${smallTargets.length} potentially small touch target(s) (< 40px)`,
        severity: 'low',
        description: 'Some buttons or links appear to have inline widths or heights below 40px.',
        whyItMatters: 'Touch targets smaller than 44×44px are hard to tap accurately on mobile, increasing user frustration.',
        recommendation: 'Ensure all buttons and links are at least 44×44px. Add padding rather than increasing the element itself.',
        estimatedImpact: '+2-4 points',
      });
    }

    // 7. No mobile-specific CSS (no @media queries in inline <style>)
    const hasMediaQuery = html.includes('@media') || html.includes('max-width') || html.includes('min-width');
    const hasExternalCSS = /<link[^>]+rel=["']stylesheet["']/i.test(html);
    if (!hasMediaQuery && !hasExternalCSS) {
      issues.push({
        title: 'No responsive CSS detected',
        severity: 'high',
        description: 'No @media queries or external stylesheets found — page may not be responsive.',
        whyItMatters: 'Without responsive CSS, the page will look identical on all screen sizes, breaking the mobile layout.',
        recommendation: 'Add CSS media queries for mobile breakpoints or use a responsive framework (Tailwind, Bootstrap).',
        estimatedImpact: '+10 points',
      });
    }

    // 8. Tables without responsive wrapper (common mobile killer)
    const tableMatches = (html.match(/<table/gi) || []).length;
    const hasResponsiveTable = html.includes('overflow-x') || html.includes('table-responsive') || html.includes('scroll');
    if (tableMatches > 0 && !hasResponsiveTable) {
      issues.push({
        title: `${tableMatches} HTML table(s) without responsive handling`,
        severity: 'low',
        description: `Found ${tableMatches} <table> element(s) with no apparent overflow/scroll wrapper.`,
        whyItMatters: 'HTML tables often overflow on mobile screens causing horizontal scrolling.',
        recommendation: 'Wrap tables in <div style="overflow-x: auto"> or redesign as cards on mobile.',
        estimatedImpact: '+2-3 points',
      });
    }

    return { analyzer: this.name, score: this.calculateScore(issues), issues, recommendations: [] };
  }
}
