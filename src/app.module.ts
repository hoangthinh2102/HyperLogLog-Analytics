import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './modules/analytics.module';

@Module({
  imports: [AnalyticsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
