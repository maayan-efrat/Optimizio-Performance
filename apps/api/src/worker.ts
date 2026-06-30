import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { ScanProcessor } from './queues/scan.processor';
import { getRedisConnection } from './config/redis.config';
import { SCAN_QUEUE } from './queues/scan.queue';

const redisConnection = getRedisConnection();

if (!redisConnection) {
  console.error('[Worker] REDIS_URL is not set — worker cannot start without a Redis connection.');
  process.exit(1);
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BullModule.forRoot({ connection: redisConnection }),
    BullModule.registerQueue({ name: SCAN_QUEUE }),
  ],
  providers: [ScanProcessor],
})
class WorkerModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  console.log(`[Worker] Scan worker started — listening on queue "${SCAN_QUEUE}"`);
  // Keep the process alive
  await new Promise(() => {});
}

bootstrap();
