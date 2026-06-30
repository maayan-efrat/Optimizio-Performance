import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { SCAN_QUEUE, ScanJobData } from './scan.queue';
import { ScanEngineService } from '../integrations/scan-engine.service';

@Processor(SCAN_QUEUE)
export class ScanProcessor extends WorkerHost {
  private prisma = new PrismaClient();
  private scanEngine = new ScanEngineService();

  async process(job: Job<ScanJobData>): Promise<void> {
    const { scanId, url, locale } = job.data;

    try {
      await job.updateProgress(10);

      const auditResult = await this.scanEngine.runFullAudit(url, locale ?? 'en');
      await job.updateProgress(80);

      const perf = auditResult.results.find((r) => r.analyzer === 'performance');
      const seo = auditResult.results.find((r) => r.analyzer === 'seo');
      const a11y = auditResult.results.find((r) => r.analyzer === 'accessibility');
      const sec = auditResult.results.find((r) => r.analyzer === 'security');

      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'completed',
          progressPercent: 100,
          overallScore: auditResult.overallScore,
          performanceScore: perf?.score ?? 0,
          seoScore: seo?.score ?? 0,
          accessibilityScore: a11y?.score ?? 0,
          securityScore: sec?.score ?? 0,
          aiSummary: auditResult.aiSummary,
          priorityRoadmap: auditResult.priorityRoadmap,
        },
      });

      await job.updateProgress(100);
    } catch (err) {
      await this.prisma.scan.update({
        where: { id: scanId },
        data: { status: 'failed', progressPercent: 0 },
      });
      throw err;
    }
  }
}
