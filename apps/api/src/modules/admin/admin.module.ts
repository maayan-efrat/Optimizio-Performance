import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, PaymentsModule],
  controllers: [AdminController],
})
export class AdminModule {}
