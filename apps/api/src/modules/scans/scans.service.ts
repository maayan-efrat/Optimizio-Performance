import { Injectable, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ScanEngineService } from '../../integrations/scan-engine.service';
import { SCAN_QUEUE, ScanJobData } from '../../queues/scan.queue';
import { getRedisConnection } from '../../config/redis.config';

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
      console.warn('[Scans] Redis unavailable — running scans synchronously (dev fallback)');
    }
  }

  async create(body: { projectId: string; url: string; locale?: 'he' | 'en' }) {
    if (this.queueEnabled) {
      return this.createViaQueue(body);
    }
    return this.createSync(body);
  }

  // --- Queue path (Redis available) ---
  private async createViaQueue(body: { projectId: string; url: string; locale?: 'he' | 'en' }) {
    const scan = await this.prisma.scan.create({
      data: {
        projectId: body.projectId,
        url: body.url,
        status: 'pending',
        progressPercent: 0,
      },
    });

    await this.scanQueue!.add('run-scan', {
      scanId: scan.id,
      projectId: body.projectId,
      url: body.url,
      locale: body.locale,
    });

    return scan;
  }

  // --- Sync fallback (no Redis) ---
  private async createSync(body: { projectId: string; url: string; locale?: 'he' | 'en' }) {
    const auditResult = await this.scanEngine.runFullAudit(body.url, body.locale ?? 'en');

    const perf = auditResult.results.find((r) => r.analyzer === 'performance');
    const seo = auditResult.results.find((r) => r.analyzer === 'seo');
    const a11y = auditResult.results.find((r) => r.analyzer === 'accessibility');
    const sec = auditResult.results.find((r) => r.analyzer === 'security');

    return this.prisma.scan.create({
      data: {
        projectId: body.projectId,
        url: body.url,
        status: 'completed',
        progressPercent: 100,
        overallScore: auditResult.overallScore,
        performanceScore: perf?.score ?? 0,
        seoScore: seo?.score ?? 0,
        accessibilityScore: a11y?.score ?? 0,
        securityScore: sec?.score ?? 0,
        aiSummary: auditResult.aiSummary,
        priorityRoadmap: auditResult.priorityRoadmap,
        rawResults: auditResult.results as any,
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
