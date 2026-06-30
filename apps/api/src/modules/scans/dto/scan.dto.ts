export class CreateScanDto {
  projectId!: string;
  url!: string;
  locale?: 'he' | 'en';
}

export class ScanResponseDto {
  id!: string;
  projectId!: string;
  url!: string;
  status!: string;
  progressPercent!: number;
  overallScore!: number;
  performanceScore!: number;
  seoScore!: number;
  accessibilityScore!: number;
  securityScore!: number;
  createdAt!: string;
  aiSummary!: string;
  priorityRoadmap!: Array<{
    rank: number;
    issue: string;
    impact: string;
    expectedImprovement: string;
    description: string;
    howToFix: string;
    codeExample?: string;
    resourceUrl?: string;
  }>;
}
