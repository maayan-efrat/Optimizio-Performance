import { Injectable, Optional, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ScanEngineService } from '../../integrations/scan-engine.service';
import { SCAN_QUEUE, ScanJobData } from '../../queues/scan.queue';
import { getRedisConnection } from '../../config/redis.config';
import { EmailService } from '../email/email.service';

const CREDITS_PER_SCAN = 100;

function pickScore(results: any[], name: string): number {
  return results.find((r: any) => r.analyzer === name)?.score ?? 0;
}

@Injectable()
export class ScansService {
  private readonly queueEnabled: boolean;

  constructor(
    private prisma: PrismaService,
    private scanEngine: ScanEngineService,
    private emailService: EmailService,
    @Optional() @InjectQueue(SCAN_QUEUE) private scanQueue: Queue<ScanJobData> | null,
  ) {
    this.queueEnabled = !!getRedisConnection() && !!scanQueue;
    if (!this.queueEnabled) {
      console.warn('[Scans] Redis unavailable — running scans synchronously');
    }
  }

  async create(body: { projectId: string; url: string; locale?: 'he' | 'en' }, userId: string) {
    // ── Credit check ──────────────────────────────────────────────────────────
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.credits < CREDITS_PER_SCAN) {
      throw new ForbiddenException(
        `Not enough credits. You have ${user.credits}, a scan costs ${CREDITS_PER_SCAN}.`,
      );
    }

    // Deduct credits immediately (before scan) to prevent double-spending
    await this.prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: CREDITS_PER_SCAN } },
    });

    try {
      const scan = this.queueEnabled
        ? await this.createViaQueue(body)
        : await this.createSync(body, userId);

      return scan;
    } catch (err) {
      // Refund credits if scan failed to start
      await this.prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: CREDITS_PER_SCAN } },
      });
      throw err;
    }
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

  private async createSync(body: { projectId: string; url: string; locale?: 'he' | 'en' }, userId: string) {
    // Create pending scan immediately so frontend can start polling
    const scan = await this.prisma.scan.create({
      data: { projectId: body.projectId, url: body.url, status: 'pending', progressPercent: 0 },
    });

    // Run audit in background — do NOT await
    setImmediate(() => this.runAuditAndUpdate(scan.id, body, userId));

    return scan;
  }

  private async runAuditAndUpdate(scanId: string, body: { projectId: string; url: string; locale?: 'he' | 'en' }, userId?: string) {
    try {
      await this.prisma.scan.update({ where: { id: scanId }, data: { progressPercent: 10 } });
      const audit = await this.scanEngine.runFullAudit(body.url, body.locale ?? 'en');
      const r = audit.results;
      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
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

      // Send scan-complete + low-credits emails (fire-and-forget)
      if (userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user && audit.overallScore !== null) {
          this.emailService
            .sendScanCompleteEmail(user.email, user.name, body.url, audit.overallScore, scanId)
            .catch(() => {});
          if (user.credits < 100) {
            this.emailService
              .sendLowCreditsEmail(user.email, user.name, user.credits)
              .catch(() => {});
          }
        }
      }
    } catch {
      await this.prisma.scan.update({ where: { id: scanId }, data: { status: 'failed', progressPercent: 0 } }).catch(() => {});
    }
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

  async saveExport(scanId: string, userId: string, userContext: string, lang: string): Promise<{ credits: number; exportId: string; exportCount: number }> {
    const EXPORT_COST = 200;
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.credits < EXPORT_COST) {
      throw new ForbiddenException(`אין מספיק קרדיטים. נדרשים ${EXPORT_COST}, יש ${user.credits}.`);
    }

    const [updated, record] = await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: EXPORT_COST } },
      }),
      (this.prisma as any).promptExport.create({
        data: { scanId, userId, userContext: userContext ?? '', lang: lang ?? 'he' },
      }),
    ]);

    const exportCount = await (this.prisma as any).promptExport.count({ where: { scanId } });
    return { credits: updated.credits, exportId: record.id, exportCount };
  }

  async getExportCount(scanId: string): Promise<number> {
    return (this.prisma as any).promptExport.count({ where: { scanId } });
  }
}
