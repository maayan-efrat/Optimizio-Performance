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
        codeExample: '<!-- Content image: -->\n<img src="team.jpg" alt="Our team of 5 engineers at our Tel Aviv office">\n\n<!-- Decorative image: -->\n<img src="divider.png" alt="">',
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
        codeExample: '<html lang="he" dir="rtl">',
        estimatedImpact: '+6 points',
        details: 'WCAG 3.1.1 (Level A) — Language of Page is a required accessibility standard.',
      });
    } else {
      const langValue = langMatch[1];
      const hebrewChars = (html.match(/[֐-׿]/g) || []).length;
      if (hebrewChars > 100 && !langValue.startsWith('he')) {
        issues.push({
          title: `Page contains Hebrew but lang="${langValue}"`,
          severity: 'medium',
          description: `Detected significant Hebrew text but lang is set to "${langValue}".`,
          whyItMatters: 'Screen readers will mispronounce Hebrew content using the wrong voice engine.',
          recommendation: `Change to <html lang="he"> or use <html lang="he" dir="rtl"> for RTL Hebrew.`,
          codeExample: '<html lang="he" dir="rtl">',
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
        codeExample: '<!-- Option 1: <label> element -->\n<label for="email">Email address</label>\n<input type="email" id="email" name="email">\n\n<!-- Option 2: aria-label -->\n<input type="search" aria-label="Search the site" placeholder="Search...">',
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
        codeExample: '<!-- Icon-only button (hamburger menu): -->\n<button aria-label="Open navigation menu">\n  <svg aria-hidden="true"><!-- hamburger icon --></svg>\n</button>',
        estimatedImpact: '+5 points',
        details: 'Icon buttons (hamburger menus, close buttons, social icons) commonly lack accessible names.',
      });
    }

    // ── iframes without title ────────────────────────────────────────────────────
    const allIframes = [...html.matchAll(/<iframe([^>]*)>/gi)];
    const iframesWithoutTitle = allIframes.filter(m => !m[0].includes('title='));
    if (iframesWithoutTitle.length > 0) {
      issues.push({
        title: `${iframesWithoutTitle.length} iframe(s) without a title attribute`,
        severity: 'medium',
        description: `${iframesWithoutTitle.length} <iframe> element(s) have no title attribute.`,
        whyItMatters: 'Screen readers announce iframes by their title. Without a title, users hear "frame" with no context — WCAG 2.4.1, 4.1.2 failure.',
        recommendation: 'Add a descriptive title to every iframe.',
        codeExample: '<iframe\n  src="https://www.youtube-nocookie.com/embed/VIDEO_ID"\n  title="Introduction video — How our product works"\n  allowfullscreen\n></iframe>',
        estimatedImpact: '+3 points',
        details: `${iframesWithoutTitle.length} iframes without title out of ${allIframes.length} total.`,
      });
    }

    // ── Duplicate IDs ────────────────────────────────────────────────────────────
    const idMatches = [...html.matchAll(/\bid="([^"]+)"/gi)].map(m => m[1]);
    const idCounts: Record<string, number> = {};
    for (const id of idMatches) { idCounts[id] = (idCounts[id] || 0) + 1; }
    const duplicateIds = Object.entries(idCounts).filter(([, count]) => count > 1).map(([id]) => id);
    if (duplicateIds.length > 0) {
      issues.push({
        title: `${duplicateIds.length} duplicate ID(s) found`,
        severity: 'medium',
        description: `IDs must be unique per page. Found duplicates: ${duplicateIds.slice(0, 5).join(', ')}`,
        whyItMatters: 'Duplicate IDs break aria-labelledby/aria-describedby associations, cause incorrect focus management, and fail WCAG 4.1.1. JavaScript getElementById() also returns only the first match.',
        recommendation: 'Make all ID values unique. Use classes for shared styling instead of IDs.',
        codeExample: '<!-- Wrong: -->\n<div id="section">...</div>\n<div id="section">...</div>\n\n<!-- Right: -->\n<div id="section-intro">...</div>\n<div id="section-main">...</div>',
        estimatedImpact: '+4 points',
        details: `Duplicate IDs: ${duplicateIds.slice(0, 10).join(', ')}`,
      });
    }

    // ── tabindex > 0 ─────────────────────────────────────────────────────────────
    const positiveTabindex = [...html.matchAll(/tabindex=["']([1-9]\d*)["']/gi)].map(m => parseInt(m[1], 10));
    if (positiveTabindex.length > 0) {
      issues.push({
        title: `${positiveTabindex.length} element(s) with tabindex > 0`,
        severity: 'medium',
        description: `Found tabindex values: ${[...new Set(positiveTabindex)].join(', ')}. Positive tabindex values override natural tab order.`,
        whyItMatters: 'Positive tabindex values create a custom tab order that overrides the natural document flow, confusing keyboard users and breaking expected navigation — WCAG 2.4.3 failure.',
        recommendation: 'Remove all positive tabindex values. Use tabindex="0" to add an element to natural tab order, tabindex="-1" to allow programmatic focus only.',
        codeExample: '<!-- Wrong: -->\n<button tabindex="3">Submit</button>\n\n<!-- Right: let the DOM order determine tab sequence -->\n<button>Submit</button>\n\n<!-- Or if needed: -->\n<div tabindex="0" role="button">Interactive element</div>',
        estimatedImpact: '+3 points',
        details: `${positiveTabindex.length} elements with tabindex > 0 found.`,
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
        codeExample: '<!-- Add as first element in <body>: -->\n<a href="#main-content"\n  class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white p-2 z-50">\n  Skip to main content\n</a>\n\n<!-- Then in your main element: -->\n<main id="main-content">',
        estimatedImpact: '+3 points',
      });
    }

    // ── Focus management ─────────────────────────────────────────────────────────
    const hasOutlineNone = (html.match(/outline\s*:\s*none|outline\s*:\s*0/g) || []).length;
    if (hasOutlineNone > 0 && !html.includes('focus-visible')) {
      issues.push({
        title: 'CSS removes focus outlines without focus-visible fallback',
        severity: 'medium',
        description: `Found ${hasOutlineNone} instance(s) of outline:none/0 in inline styles.`,
        whyItMatters: 'Removing focus outlines makes the site unusable for keyboard-only users who need visible focus indicators.',
        recommendation: 'Replace outline:none with :focus-visible { outline: 2px solid blue } to show focus for keyboard users only.',
        codeExample: '/* Wrong: removes focus indicator for keyboard users */\nbutton:focus { outline: none; }\n\n/* Right: remove only for mouse users */\nbutton:focus:not(:focus-visible) { outline: none; }\nbutton:focus-visible { outline: 2px solid #4f46e5; outline-offset: 2px; }',
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

    // ── aria-hidden on focusable elements ────────────────────────────────────────
    const ariaHiddenFocusable = [
      ...(html.match(/aria-hidden=["']true["'][^>]*(?:href=|tabindex=(?!"?-1)|<button|<input|<select|<textarea)/gi) || []),
      ...(html.match(/(?:href=|tabindex=(?!"?-1)|<button|<input|<select|<textarea)[^>]*aria-hidden=["']true["']/gi) || []),
    ].length;
    if (ariaHiddenFocusable > 0) {
      issues.push({
        title: `${ariaHiddenFocusable} focusable element(s) with aria-hidden="true"`,
        severity: 'high',
        description: `Elements that are keyboard focusable but have aria-hidden="true" — keyboard users can focus elements that screen readers skip.`,
        whyItMatters: 'When a keyboard-focusable element has aria-hidden="true", keyboard users can tab to it but screen readers announce nothing — WCAG 4.1.2 failure. Can cause completely invisible focus traps.',
        recommendation: 'Never put aria-hidden="true" on a focusable element. Either remove aria-hidden, or add tabindex="-1" to remove it from tab order.',
        codeExample: '<!-- Wrong: focusable button hidden from screen readers -->\n<button aria-hidden="true">Close</button>\n\n<!-- Right option 1: not hidden -->\n<button aria-label="Close dialog">✕</button>\n\n<!-- Right option 2: truly hidden -->\n<button aria-hidden="true" tabindex="-1">✕</button>',
        estimatedImpact: '+5 points',
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
        iframeCount: allIframes.length,
        iframesWithoutTitle: iframesWithoutTitle.length,
        duplicateIds: duplicateIds.slice(0, 10),
        positiveTabindexCount: positiveTabindex.length,
      },
    };
  }
}
