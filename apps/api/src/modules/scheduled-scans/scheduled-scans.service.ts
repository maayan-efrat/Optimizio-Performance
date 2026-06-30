import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ScansService } from '../scans/scans.service';

@Injectable()
export class ScheduledScansService {
  private readonly log = new Logger(ScheduledScansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scansService: ScansService,
  ) {}

  // Run every day at 03:00 to check which projects need auto-scanning
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runScheduledScans() {
    this.log.log('Checking scheduled scans...');
    const now = new Date();

    const projects = await this.prisma.project.findMany({
      where: { scanFrequency: { not: 'manual' }, status: 'active' },
      include: { user: true },
    });

    for (const project of projects) {
      const shouldRun = this.shouldRunNow(project.scanFrequency, project.lastAutoScan, now);
      if (!shouldRun) continue;

      if (project.user.credits < 100) {
        this.log.warn(`Skipping ${project.domain} — user ${project.userId} has insufficient credits (${project.user.credits})`);
        continue;
      }

      try {
        this.log.log(`Auto-scanning ${project.domain} (frequency: ${project.scanFrequency})`);
        await this.scansService.create(
          { projectId: project.id, url: project.domain, locale: 'he' },
          project.userId,
        );
        await this.prisma.project.update({
          where: { id: project.id },
          data: { lastAutoScan: now },
        });
      } catch (err) {
        this.log.error(`Auto-scan failed for ${project.domain}: ${(err as Error).message}`);
      }
    }
  }

  private shouldRunNow(frequency: string, lastScan: Date | null, now: Date): boolean {
    if (!lastScan) return true;
    const diffDays = (now.getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24);
    if (frequency === 'weekly') return diffDays >= 7;
    if (frequency === 'monthly') return diffDays >= 30;
    return false;
  }
}
