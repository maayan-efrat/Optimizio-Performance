import { BaseAnalyzer, AnalyzerResult, WebsiteData, AnalyzerIssue } from './base.analyzer';

interface SchemaType {
  required: string[];
  recommended: string[];
  richResultEligible: boolean;
}

const SCHEMA_RULES: Record<string, SchemaType> = {
  Article:          { required: ['headline', 'author', 'datePublished'], recommended: ['image', 'description', 'dateModified'], richResultEligible: true },
  NewsArticle:      { required: ['headline', 'author', 'datePublished'], recommended: ['image', 'description'], richResultEligible: true },
  Product:          { required: ['name'], recommended: ['image', 'description', 'offers', 'aggregateRating', 'brand'], richResultEligible: true },
  LocalBusiness:    { required: ['name', 'address'], recommended: ['telephone', 'openingHours', 'url', 'geo', 'image'], richResultEligible: true },
  Restaurant:       { required: ['name', 'address'], recommended: ['telephone', 'menu', 'servesCuisine', 'priceRange'], richResultEligible: true },
  FAQPage:          { required: ['mainEntity'], recommended: [], richResultEligible: true },
  HowTo:            { required: ['name', 'step'], recommended: ['image', 'description', 'totalTime'], richResultEligible: true },
  BreadcrumbList:   { required: ['itemListElement'], recommended: [], richResultEligible: true },
  Organization:     { required: ['name'], recommended: ['url', 'logo', 'contactPoint', 'sameAs'], richResultEligible: false },
  WebSite:          { required: ['name', 'url'], recommended: ['potentialAction'], richResultEligible: false },
  Person:           { required: ['name'], recommended: ['url', 'image', 'jobTitle', 'worksFor'], richResultEligible: false },
  Event:            { required: ['name', 'startDate', 'location'], recommended: ['endDate', 'image', 'description', 'offers'], richResultEligible: true },
  Recipe:           { required: ['name', 'recipeIngredient', 'recipeInstructions'], recommended: ['image', 'author', 'cookTime', 'nutrition'], richResultEligible: true },
  Review:           { required: ['itemReviewed', 'author', 'reviewRating'], recommended: ['datePublished', 'description'], richResultEligible: true },
};

export class SchemaAnalyzer extends BaseAnalyzer {
  name = 'schema';

  async analyze(data: WebsiteData): Promise<AnalyzerResult> {
    const issues: AnalyzerIssue[] = [];
    const html = data.html || '';

    const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

    if (blocks.length === 0) {
      issues.push({
        title: 'No Schema.org structured data found',
        severity: 'medium',
        description: 'No JSON-LD structured data was detected on this page.',
        whyItMatters: 'Structured data enables rich results in Google (stars, FAQs, breadcrumbs) and helps search engines understand your content.',
        recommendation: 'Add JSON-LD markup relevant to your page type. Use schema.org to find the right type.',
        estimatedImpact: '+5-10 points',
        details: 'Common types: LocalBusiness, Article, Product, FAQPage, BreadcrumbList.',
      });
      return { analyzer: this.name, score: this.calculateScore(issues), issues, recommendations: [], metadata: { schemasFound: [] } };
    }

    const schemasFound: string[] = [];
    const richResultEligible: string[] = [];

    for (const [, raw] of blocks) {
      let schema: Record<string, any>;
      try {
        schema = JSON.parse(raw.trim());
      } catch {
        issues.push({
          title: 'Invalid JSON-LD: parse error',
          severity: 'high',
          description: 'A JSON-LD block could not be parsed — it contains a syntax error.',
          whyItMatters: 'Invalid JSON-LD is ignored by search engines entirely.',
          recommendation: 'Validate your structured data at search.google.com/test/rich-results and fix the JSON syntax.',
          estimatedImpact: '+8 points',
          details: raw.slice(0, 200),
        });
        continue;
      }

      // Handle @graph arrays
      const items: Record<string, any>[] = schema['@graph']
        ? schema['@graph']
        : [schema];

      for (const item of items) {
        const type: string = Array.isArray(item['@type']) ? item['@type'][0] : (item['@type'] ?? 'Unknown');
        schemasFound.push(type);

        const rules = SCHEMA_RULES[type];
        if (!rules) continue;

        if (rules.richResultEligible) richResultEligible.push(type);

        // Check required fields
        const missingRequired = rules.required.filter(f => !item[f]);
        if (missingRequired.length > 0) {
          issues.push({
            title: `Schema "${type}" missing required fields: ${missingRequired.join(', ')}`,
            severity: 'high',
            description: `The ${type} schema is missing: ${missingRequired.join(', ')}.`,
            whyItMatters: `Missing required fields prevent Google from generating rich results for ${type}.`,
            recommendation: `Add the missing fields: ${missingRequired.map(f => `"${f}"`).join(', ')}.`,
            estimatedImpact: '+6-10 points',
            details: `Type: ${type}. Required: ${rules.required.join(', ')}. Found: ${rules.required.filter(f => item[f]).join(', ') || 'none'}.`,
          });
        }

        // Check recommended fields
        const missingRecommended = rules.recommended.filter(f => !item[f]);
        if (missingRecommended.length > Math.floor(rules.recommended.length / 2)) {
          issues.push({
            title: `Schema "${type}" — ${missingRecommended.length} recommended fields missing`,
            severity: 'low',
            description: `Consider adding: ${missingRecommended.join(', ')}.`,
            whyItMatters: 'More complete schemas get better rich result treatment from Google.',
            recommendation: `Add optional fields to enrich your ${type} schema: ${missingRecommended.slice(0, 4).join(', ')}.`,
            estimatedImpact: '+2-4 points',
          });
        }
      }
    }

    return {
      analyzer: this.name,
      score: this.calculateScore(issues),
      issues,
      recommendations: [],
      metadata: { schemasFound, richResultEligible },
    };
  }
}
