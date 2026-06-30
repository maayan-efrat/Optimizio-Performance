import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, body: { name: string; domain: string }) {
    return this.prisma.project.create({
      data: { name: body.name, domain: body.domain, userId },
    });
  }

  list(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  get(id: string, userId: string) {
    return this.prisma.project.findFirst({ where: { id, userId } });
  }
}
