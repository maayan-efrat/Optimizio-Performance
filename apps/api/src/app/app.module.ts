import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';
import { ProjectsModule } from '../modules/projects/projects.module';
import { ScansModule } from '../modules/scans/scans.module';
import { PaymentsModule } from '../modules/payments/payments.module';
import { ScheduledScansModule } from '../modules/scheduled-scans/scheduled-scans.module';
import { AdminModule } from '../modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    ScansModule,
    PaymentsModule,
    ScheduledScansModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
