import { Body, Controller, Get, Param, Patch, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(role: string) {
    if (role !== 'admin') throw new ForbiddenException('Admin only');
  }

  @Get('users')
  async getUsers(@Request() req: { user: { id: string; role: string } }) {
    this.assertAdmin(req.user.role);
    const users = await this.prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true, credits: true,
        emailVerified: true, createdAt: true,
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  }

  @Patch('users/:id/credits')
  async updateCredits(
    @Request() req: { user: { id: string; role: string } },
    @Param('id') id: string,
    @Body() body: { credits: number },
  ) {
    this.assertAdmin(req.user.role);
    const user = await this.prisma.user.update({
      where: { id },
      data: { credits: body.credits },
      select: { id: true, email: true, name: true, credits: true },
    });
    return user;
  }

  @Patch('users/:id/role')
  async updateRole(
    @Request() req: { user: { id: string; role: string } },
    @Param('id') id: string,
    @Body() body: { role: 'user' | 'admin' },
  ) {
    this.assertAdmin(req.user.role);
    const user = await this.prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, email: true, name: true, role: true },
    });
    return user;
  }

  @Get('stats')
  async getStats(@Request() req: { user: { id: string; role: string } }) {
    this.assertAdmin(req.user.role);
    const [totalUsers, totalScans, totalProjects] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.scan.count(),
      this.prisma.project.count(),
    ]);
    const scansToday = await this.prisma.scan.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });
    return { totalUsers, totalScans, totalProjects, scansToday };
  }
}
