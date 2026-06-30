import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { SCAN_QUEUE, ScanJobData } from './scan.queue';
import { ScanEngineService } from '../integrations/scan-engine.service';

function pickScore(results: any[], name: string): number {
  return results.find((r: any) => r.analyzer === name)?.score ?? 0;
}

@Processor(SCAN_QUEUE)
export class ScanProcessor extends WorkerHost {
  private prisma = new PrismaClient();
  private scanEngine = new ScanEngineService();

  async process(job: Job<ScanJobData>): Promise<void> {
    const { scanId, url, locale } = job.data;

    try {
      await job.updateProgress(10);

      const audit = await this.scanEngine.runFullAudit(url, locale ?? 'en');
      await job.updateProgress(80);

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
