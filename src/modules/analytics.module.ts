import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { HyperLogLogService } from './services/hyperloglog.service';
import { LogProcessorService } from './services/log-processor.service';
import { LogGeneratorService } from './services/log-generator.service';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [AnalyticsController],
  providers: [
    HyperLogLogService,
    LogProcessorService,
    LogGeneratorService,
  ],
  exports: [HyperLogLogService, LogProcessorService],
})
export class AnalyticsModule {}