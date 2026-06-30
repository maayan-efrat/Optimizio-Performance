import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ScansService } from './scans.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@Controller('scans')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  // ── Public (no auth) ──────────────────────────────────────────────────────

  @Get('public/:id')
  getPublic(@Param('id') id: string) {
    return this.scansService.get(id);
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
