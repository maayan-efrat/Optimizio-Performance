import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledScansService } from './scheduled-scans.service';
import { ScansModule } from '../scans/scans.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, ScansModule],
  providers: [ScheduledScansService],
})
export class ScheduledScansModule {}
