export interface AnalyzerIssue {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  whyItMatters: string;
  recommendation: string;
  /** Short code snippet shown in the report as an example fix */
  codeExample?: string;
  estimatedImpact?: string;
  /** Plain-language business impact — shown to non-technical users */
  businessImpact?: string;
  /** How hard to fix */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** Rough fix time, e.g. "15 דקות" or "1-2 hours" */
  fixTime?: string;
  resourceUrl?: string;
  details?: string;
  affectedUrls?: string[];
}

export interface AnalyzerResult {
  analyzer: string;
  score: number;
  issues: AnalyzerIssue[];
  recommendations: string[];
  metadata?: Record<string, unknown>;
}

export interface TechStack {
  cms: string | null;
  framework: string | null;
  tags: string[];
}

export interface FetchedImage {
  src: string;
  size?: number;
  httpStatus?: number;
  hasAlt: boolean;
  altText?: string;
  hasLazy: boolean;
  hasExplicitDimensions: boolean;
}

export interface WebsiteData {
  url: string;
  html: string;
  responseHeaders?: Record<string, string>;
  fetchedImages?: FetchedImage[];
  screenshot?: string;
  metrics?: Record<string, unknown>;
  fetchDurationMs?: number;
  htmlSizeBytes?: number;
  hasSitemap?: boolean;
  hasRobotsTxt?: boolean;
  httpRedirectsToHttps?: boolean;
  hasCustom404?: boolean;
  techStack?: TechStack;
  /** True when the scanned URL is a local/dev/preview environment */
  isDevelopment?: boolean;
  /** Sensitive file paths that returned HTTP 200 (only probed in production) */
  exposedPaths?: string[];
}

export abstract class BaseAnalyzer {
  abstract name: string;
  abstract analyze(data: WebsiteData): Promise<AnalyzerResult>;

  protected calculateScore(issues: AnalyzerIssue[]): number {
    const w = { critical: 25, high: 12, medium: 5, low: 2 };
    const deductions = issues.reduce((sum, i) => sum + (w[i.severity] ?? 0), 0);
    return Math.max(0, Math.min(100, 100 - deductions));
  }

  protected resolveUrl(src: string, base: string): string {
    try {
      return new URL(src, base).href;
    } catch {
      return src;
    }
  }
}
