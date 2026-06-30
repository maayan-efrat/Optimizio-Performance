import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Body() body: { name: string; domain: string },
  ) {
    return this.projectsService.create(req.user.id, body);
  }

  @Get()
  list(@Request() req: { user: { id: string } }) {
    return this.projectsService.list(req.user.id);
  }

  @Get(':id')
  get(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.projectsService.get(id, req.user.id);
  }

  @Patch(':id/frequency')
  updateFrequency(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: { frequency: 'manual' | 'weekly' | 'monthly' },
  ) {
    return this.projectsService.updateFrequency(id, req.user.id, body.frequency);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.projectsService.delete(id, req.user.id);
  }
}
