import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

export class AccessibilityAnalyzer extends BaseAnalyzer {
  name = 'accessibility';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';
    const images = data.fetchedImages || [];

    // 1. Images missing alt text
    const noAlt = images.filter((img) => !img.hasAlt);
    const emptyAlt = images.filter((img) => img.altText === '');
    if (noAlt.length > 0) {
      issues.push({
        title: `${noAlt.length} image(s) missing alt text`,
        severity: 'high',
        description: `${noAlt.length} of ${images.length} images scanned completely lack alt attributes.`,
        whyItMatters: 'Screen readers cannot describe images without alt text — WCAG 1.1.1 failure.',
        recommendation: 'Add a descriptive alt attribute to every <img> tag. Example: <img src="photo.jpg" alt="תיאור התמונה">',
        estimatedImpact: '+12 points',
        resourceUrl: noAlt[0]?.src,
        affectedUrls: noAlt.map(i => i.src),
        details: `תמונות חסרות alt:\n${noAlt.map(i => i.src).join('\n')}`,
      });
    }
    if (emptyAlt.length > 0 && emptyAlt.length === images.length && images.length > 1) {
      issues.push({
        title: `${emptyAlt.length} image(s) have empty alt=""`,
        severity: 'medium',
        description: 'All images have alt="" which hides them from screen readers completely.',
        whyItMatters: 'Empty alt is valid for decorative images only — content images need description.',
        recommendation: 'Add meaningful alt text for content images; keep alt="" only for decorative ones.',
        estimatedImpact: '+5 points',
        resourceUrl: emptyAlt[0]?.src,
      });
    }

    // 2. HTML lang attribute
    if (!/<html[^>]+lang=/i.test(html)) {
      issues.push({
        title: 'Missing lang attribute on <html>',
        severity: 'high',
        description: 'The <html> element has no lang attribute.',
        whyItMatters: 'Screen readers use the lang attribute to select the correct voice/pronunciation engine.',
        recommendation: 'Add the appropriate lang attribute, e.g.: <html lang="he"> or <html lang="en">',
        estimatedImpact: '+6 points',
        details: 'WCAG 3.1.1 (Level A) requires a language declaration.',
      });
    }

    // 3. Form inputs without labels
    const inputs = [...html.matchAll(/<input[^>]+type="(?!hidden)[^"]*"[^>]*>/gi)];
    const labels = (html.match(/<label[^>]*>/g) || []).length;
    const unlabeledInputs = Math.max(0, inputs.length - labels);
    if (unlabeledInputs > 0) {
      issues.push({
        title: `${unlabeledInputs} form input(s) potentially without labels`,
        severity: 'high',
        description: `Found ${inputs.length} visible inputs but only ${labels} <label> elements.`,
        whyItMatters: 'Screen readers cannot identify unlabelled inputs — WCAG 1.3.1 failure.',
        recommendation: 'Wrap each input in a <label> or use aria-label / aria-labelledby.',
        estimatedImpact: '+5 points',
      });
    }

    // 4. Heading hierarchy
    const headings = ['h1','h2','h3','h4'].flatMap(tag => {
      const matches = html.match(new RegExp(`<${tag}[^>]*>`, 'gi')) || [];
      return matches.map(() => parseInt(tag[1]));
    }).sort((a, b) => a - b);
    let hierarchyBroken = false;
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] - headings[i - 1] > 1) { hierarchyBroken = true; break; }
    }
    if (hierarchyBroken) {
      issues.push({
        title: 'Heading hierarchy is skipped (e.g. H1 → H3)',
        severity: 'medium',
        description: 'Headings skip levels (e.g. H1 directly to H3 with no H2).',
        whyItMatters: 'Screen reader users navigate by headings — gaps create confusion.',
        recommendation: 'Use headings sequentially: H1 → H2 → H3. Never skip a level.',
        estimatedImpact: '+4 points',
        details: `Heading levels found: ${headings.join(' → ')}`,
      });
    }

    // 5. Interactive elements without accessible names
    const buttonsWithNoText = (html.match(/<button[^>]*>\s*<\/button>/gi) || []).length
      + (html.match(/<button[^>]*><img[^>]*(?!alt=)[^>]*><\/button>/gi) || []).length;
    if (buttonsWithNoText > 0) {
      issues.push({
        title: `${buttonsWithNoText} button(s) with no accessible label`,
        severity: 'high',
        description: 'Buttons with no text or aria-label are invisible to screen readers.',
        whyItMatters: 'WCAG 4.1.2 requires all interactive elements to have accessible names.',
        recommendation: 'Add visible text or aria-label to every button.',
        estimatedImpact: '+5 points',
      });
    }

    const score = this.calculateScore(issues);
    return { analyzer: this.name, score, issues, recommendations: [] };
  }
}
