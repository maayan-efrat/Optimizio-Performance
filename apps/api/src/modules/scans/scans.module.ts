import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';
import { ScanEngineService } from '../../integrations/scan-engine.service';
import { ScanProcessor } from '../../queues/scan.processor';
import { SCAN_QUEUE } from '../../queues/scan.queue';
import { getRedisConnection } from '../../config/redis.config';

const redisConnection = getRedisConnection();

const bullImports = redisConnection
  ? [
      BullModule.forRoot({ connection: redisConnection }),
      BullModule.registerQueue({ name: SCAN_QUEUE }),
    ]
  : [];

@Module({
  imports: bullImports,
  controllers: [ScansController],
  providers: [
    ScansService,
    ScanEngineService,
    ...(redisConnection ? [ScanProcessor] : []),
  ],
  exports: [ScansService],
})
export class ScansModule {}
