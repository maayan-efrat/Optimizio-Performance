import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ScansService } from './scans.service';
import { ScanEngineService } from '../../integrations/scan-engine.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('scans')
export class ScansController {
  constructor(
    private readonly scansService: ScansService,
    private readonly scanEngine: ScanEngineService,
  ) {}

  // ── Public (no auth) ──────────────────────────────────────────────────────

  @Get('public/:id')
  getPublic(@Param('id') id: string) {
    return this.scansService.get(id);
  }

  // ── Authenticated — quick multi-URL compare (no DB persistence) ────────────

  @UseGuards(JwtAuthGuard)
  @Post('compare')
  async compare(@Body() body: { urls: string[] }) {
    const urls = (body.urls ?? []).filter((u: string) => {
      try { new URL(u); return true; } catch { return false; }
    }).slice(0, 4);
    const results = await Promise.all(urls.map(u => this.scanEngine.runQuickScore(u)));
    return results;
  }

  // ── Authenticated ────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() body: { projectId: string; url: string; locale?: 'he' | 'en' },
    @CurrentUser() user: { id: string },
  ) {
    return this.scansService.create(body, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId')
  listByProject(@Param('projectId') projectId: string) {
    return this.scansService.listByProject(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/progress')
  async getProgress(@Param('id') id: string) {
    const scan = await this.scansService.get(id);
    if (!scan) return { status: 'not_found', progressPercent: 0 };
    return { id: scan.id, status: scan.status, progressPercent: scan.progressPercent };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/export-prompt')
  saveExport(
    @Param('id') id: string,
    @Body() body: { userContext?: string; lang?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.scansService.saveExport(id, user.id, body.userContext ?? '', body.lang ?? 'he');
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/export-count')
  getExportCount(@Param('id') id: string) {
    return this.scansService.getExportCount(id).then(count => ({ count }));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.scansService.get(id);
  }
}
