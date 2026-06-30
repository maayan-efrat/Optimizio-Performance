import { Injectable, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ScanEngineService } from '../../integrations/scan-engine.service';
import { SCAN_QUEUE, ScanJobData } from '../../queues/scan.queue';
import { getRedisConnection } from '../../config/redis.config';

function pickScore(results: any[], name: string): number {
  return results.find((r: any) => r.analyzer === name)?.score ?? 0;
}

@Injectable()
export class ScansService {
  private readonly queueEnabled: boolean;

  constructor(
    private prisma: PrismaService,
    private scanEngine: ScanEngineService,
    @Optional() @InjectQueue(SCAN_QUEUE) private scanQueue: Queue<ScanJobData> | null,
  ) {
    this.queueEnabled = !!getRedisConnection() && !!scanQueue;
    if (!this.queueEnabled) {
      console.warn('[Scans] Redis unavailable — running scans synchronously');
    }
  }

  async create(body: { projectId: string; url: string; locale?: 'he' | 'en' }) {
    return this.queueEnabled
      ? this.createViaQueue(body)
      : this.createSync(body);
  }

  private async createViaQueue(body: { projectId: string; url: string; locale?: 'he' | 'en' }) {
    const scan = await this.prisma.scan.create({
      data: { projectId: body.projectId, url: body.url, status: 'pending', progressPercent: 0 },
    });
    await this.scanQueue!.add('run-scan', {
      scanId: scan.id, projectId: body.projectId, url: body.url, locale: body.locale,
    });
    return scan;
  }

  private async createSync(body: { projectId: string; url: string; locale?: 'he' | 'en' }) {
    const audit = await this.scanEngine.runFullAudit(body.url, body.locale ?? 'en');
    const r = audit.results;

    return this.prisma.scan.create({
      data: {
        projectId:          body.projectId,
        url:                body.url,
        status:             'completed',
        progressPercent:    100,
        overallScore:       audit.overallScore,
        performanceScore:   pickScore(r, 'performance'),
        seoScore:           pickScore(r, 'seo'),
        accessibilityScore: pickScore(r, 'accessibility'),
        securityScore:      pickScore(r, 'security'),
        mobileScore:        pickScore(r, 'mobile'),
        privacyScore:       pickScore(r, 'privacy'),
        schemaScore:        pickScore(r, 'schema'),
        jsCssScore:         pickScore(r, 'javascript-css'),
        linksScore:         pickScore(r, 'links'),
        aiSummary:          audit.aiSummary,
        priorityRoadmap:    audit.priorityRoadmap as any,
        rawResults:         audit.results as any,
        cwvLcp:             audit.cwv.lcp,
        cwvCls:             audit.cwv.cls,
        cwvInp:             audit.cwv.inp,
        cwvTtfb:            audit.cwv.ttfb,
        cwvPsiScore:        audit.cwv.psiScore,
        cwvData:            audit.cwv as any,
      },
    });
  }

  get(id: string) {
    return this.prisma.scan.findUnique({ where: { id } });
  }

  listByProject(projectId: string) {
    return this.prisma.scan.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
