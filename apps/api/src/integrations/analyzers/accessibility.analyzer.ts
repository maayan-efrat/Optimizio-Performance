import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

export class AccessibilityAnalyzer extends BaseAnalyzer {
  name = 'accessibility';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';
    const images = data.fetchedImages || [];

    // ── Images missing alt text ────────────────────────────────────────────────
    const noAlt = images.filter(img => !img.hasAlt);
    const emptyAlt = images.filter(img => img.altText === '');
    if (noAlt.length > 0) {
      issues.push({
        title: `${noAlt.length} image(s) completely missing alt attribute`,
        severity: 'high',
        description: `${noAlt.length} of ${images.length} images have no alt attribute at all.`,
        whyItMatters: 'Screen readers cannot describe images without alt text — WCAG 1.1.1 failure.',
        recommendation: 'Add a descriptive alt attribute to every content image. Use alt="" only for purely decorative images.',
        estimatedImpact: '+12 points',
        resourceUrl: noAlt[0]?.src,
        affectedUrls: noAlt.map(i => i.src),
        details: `Missing alt on:\n${noAlt.slice(0, 5).map(i => i.src).join('\n')}`,
      });
    }
    if (emptyAlt.length > 0 && emptyAlt.length === images.length && images.length > 1) {
      issues.push({
        title: `All ${emptyAlt.length} image(s) have empty alt=""`,
        severity: 'medium',
        description: 'All images have alt="" — this hides them from screen readers completely.',
        whyItMatters: 'Empty alt is valid for decorative images only — content images need descriptive text.',
        recommendation: 'Add meaningful alt text for images that convey information. Keep alt="" only for decorative elements.',
        estimatedImpact: '+5 points',
        resourceUrl: emptyAlt[0]?.src,
      });
    }

    // ── HTML lang attribute ─────────────────────────────────────────────────────
    const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
    if (!langMatch) {
      issues.push({
        title: 'Missing lang attribute on <html>',
        severity: 'high',
        description: 'The <html> element has no lang attribute.',
        whyItMatters: 'Screen readers use the lang attribute to select the correct voice/pronunciation engine.',
        recommendation: 'Add lang to <html>: <html lang="he"> for Hebrew, <html lang="en"> for English.',
        estimatedImpact: '+6 points',
        details: 'WCAG 3.1.1 (Level A) — Language of Page is a required accessibility standard.',
      });
    } else {
      const langValue = langMatch[1];
      // Check if lang is set but doesn't match page content
      const hebrewChars = (html.match(/[֐-׿]/g) || []).length;
      if (hebrewChars > 100 && !langValue.startsWith('he')) {
        issues.push({
          title: `Page contains Hebrew but lang="${langValue}"`,
          severity: 'medium',
          description: `Detected significant Hebrew text but lang is set to "${langValue}".`,
          whyItMatters: 'Screen readers will mispronounce Hebrew content using the wrong voice engine.',
          recommendation: `Change to <html lang="he"> or use <html lang="he" dir="rtl"> for RTL Hebrew.`,
          estimatedImpact: '+4 points',
          details: `Detected ${hebrewChars} Hebrew characters. Current lang: "${langValue}".`,
        });
      }
    }

    // ── Form inputs without labels ──────────────────────────────────────────────
    const inputs = [...html.matchAll(/<input[^>]+type=["'](?!hidden|submit|button|reset|checkbox|radio)[^"']*["'][^>]*>/gi)];
    const labels = (html.match(/<label[^>]*>/g) || []).length;
    const ariaLabels = (html.match(/aria-label=/g) || []).length;
    const ariaLabelledBy = (html.match(/aria-labelledby=/g) || []).length;
    const unlabeled = Math.max(0, inputs.length - labels - ariaLabels - ariaLabelledBy);
    if (unlabeled > 0) {
      issues.push({
        title: `${unlabeled} form input(s) potentially without accessible labels`,
        severity: 'high',
        description: `Found ${inputs.length} visible text inputs, ${labels} <label> elements, ${ariaLabels} aria-label attributes.`,
        whyItMatters: 'Screen readers cannot identify unlabelled inputs — WCAG 1.3.1 failure.',
        recommendation: 'Wrap each input in a <label> or add aria-label="Field name" to each input.',
        estimatedImpact: '+5 points',
        details: `Inputs: ${inputs.length}, Labels: ${labels}, aria-label: ${ariaLabels}, aria-labelledby: ${ariaLabelledBy}`,
      });
    }

    // ── Heading hierarchy ────────────────────────────────────────────────────────
    const headingLevels: number[] = [];
    for (let level = 1; level <= 6; level++) {
      const count = (html.match(new RegExp(`<h${level}[^>]*>`, 'gi')) || []).length;
      for (let i = 0; i < count; i++) headingLevels.push(level);
    }
    headingLevels.sort((a, b) => a - b);
    let hierarchyBroken = false;
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) { hierarchyBroken = true; break; }
    }
    if (hierarchyBroken && headingLevels.length > 1) {
      issues.push({
        title: 'Heading hierarchy skips levels',
        severity: 'medium',
        description: `Headings jump levels (e.g. H1 → H3 skipping H2).`,
        whyItMatters: 'Screen reader users navigate pages by headings — gaps create confusion and reduce accessibility.',
        recommendation: 'Use headings sequentially: H1 → H2 → H3. Never skip a level.',
        estimatedImpact: '+4 points',
        details: `Heading structure: ${[...new Set(headingLevels)].map(l => `H${l}`).join(' → ')}`,
      });
    }

    // ── Buttons without accessible names ────────────────────────────────────────
    const emptyButtons = (html.match(/<button[^>]*>\s*<\/button>/gi) || []).length;
    const iconButtons  = (html.match(/<button[^>]*>(?:\s*<(?:svg|img|i)[^>]*>)+\s*<\/button>/gi) || []).length;
    const totalUnnamedButtons = emptyButtons + iconButtons;
    if (totalUnnamedButtons > 0) {
      issues.push({
        title: `${totalUnnamedButtons} button(s) with no accessible label`,
        severity: 'high',
        description: `${emptyButtons} empty button(s) + ${iconButtons} icon-only button(s) found.`,
        whyItMatters: 'Buttons without text or aria-label are invisible to screen readers — WCAG 4.1.2 failure.',
        recommendation: 'Add visible text or aria-label="Action name" to every button.',
        estimatedImpact: '+5 points',
        details: 'Icon buttons (hamburger menus, close buttons, social icons) commonly lack accessible names.',
      });
    }

    // ── Skip navigation link ─────────────────────────────────────────────────────
    const hasSkipLink = html.includes('#main') || html.includes('#content') || html.includes('skip') || html.includes('סגור');
    const hasNav = /<nav[^>]*>/i.test(html);
    if (hasNav && !hasSkipLink) {
      issues.push({
        title: 'No skip navigation link detected',
        severity: 'low',
        description: 'Page has navigation but no "skip to content" link.',
        whyItMatters: 'Keyboard and screen reader users must tab through all nav links on every page without a skip link.',
        recommendation: 'Add a visually hidden <a href="#main" class="skip-link">Skip to content</a> as the first element in <body>.',
        estimatedImpact: '+3 points',
      });
    }

    // ── Focus management ─────────────────────────────────────────────────────────
    const hasTabIndex = (html.match(/tabindex=["']-1["']/g) || []).length;
    const hasOutlineNone = (html.match(/outline\s*:\s*none|outline\s*:\s*0/g) || []).length;
    if (hasOutlineNone > 0 && !html.includes('focus-visible')) {
      issues.push({
        title: 'CSS removes focus outlines without focus-visible fallback',
        severity: 'medium',
        description: `Found ${hasOutlineNone} instance(s) of outline:none/0 in inline styles.`,
        whyItMatters: 'Removing focus outlines makes the site unusable for keyboard-only users who need visible focus indicators.',
        recommendation: 'Replace outline:none with :focus-visible { outline: 2px solid blue } to show focus for keyboard users only.',
        estimatedImpact: '+6 points',
        details: `Found outline:none in ${hasOutlineNone} inline style attribute(s).`,
      });
    }

    // ── Color contrast (basic heuristic) ────────────────────────────────────────
    const lightOnLight = (html.match(/color:\s*#[ef][ef][ef][ef][ef][ef]/gi) || []).length
      + (html.match(/color:\s*white|color:\s*#fff/gi) || []).length;
    if (lightOnLight > 2) {
      issues.push({
        title: 'Possible low-contrast text detected in inline styles',
        severity: 'low',
        description: `Found ${lightOnLight} instance(s) of very light text colors in inline styles.`,
        whyItMatters: 'Low color contrast makes text unreadable for users with visual impairments. WCAG AA requires 4.5:1 ratio.',
        recommendation: 'Use a contrast checker (e.g. WebAIM) to verify all text meets WCAG AA (4.5:1 normal, 3:1 large text).',
        estimatedImpact: '+3 points',
        details: 'Use browser DevTools accessibility panel to audit contrast ratios.',
      });
    }

    const score = this.calculateScore(issues);
    return {
      analyzer: this.name,
      score,
      issues,
      recommendations: [],
      metadata: {
        imageCount: images.length,
        imagesWithAlt: images.filter(i => i.hasAlt).length,
        imagesWithEmptyAlt: emptyAlt.length,
        hasLangAttr: !!langMatch,
        langValue: langMatch?.[1] || null,
        inputCount: inputs.length,
        labelCount: labels,
        headingStructure: [...new Set(headingLevels)].map(l => `H${l}`).join('→'),
        hasSkipLink,
        hasNav,
      },
    };
  }
}
