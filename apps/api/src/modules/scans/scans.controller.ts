import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ScansService } from './scans.service';
import { ScanEngineService } from '../../integrations/scan-engine.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

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
  create(@Body() body: { projectId: string; url: string; locale?: 'he' | 'en' }) {
    return this.scansService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId')
  listByProject(@Param('projectId') projectId: string) {
    return this.scansService.listByProject(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.scansService.get(id);
  }
}
