import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ScansService } from './scans.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('scans')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  create(@Body() body: { projectId: string; url: string; locale?: 'he' | 'en' }) {
    return this.scansService.create(body);
  }

  // Static route must come before dynamic :id
  @Get('project/:projectId')
  listByProject(@Param('projectId') projectId: string) {
    return this.scansService.listByProject(projectId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.scansService.get(id);
  }
}
