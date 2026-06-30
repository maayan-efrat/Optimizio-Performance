import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { getRedisConnection } from '../config/redis.config';
import { SCAN_QUEUE } from './scan.queue';

const redisConnection = getRedisConnection();

@Module({
  imports: redisConnection
    ? [
        BullModule.forRoot({ connection: redisConnection }),
        BullModule.registerQueue({ name: SCAN_QUEUE }),
      ]
    : [],
  exports: redisConnection ? [BullModule] : [],
})
export class ScanQueueModule {}
