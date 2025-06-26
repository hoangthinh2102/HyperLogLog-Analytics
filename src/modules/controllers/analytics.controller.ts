import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HyperLogLogService } from '../services/hyperloglog.service';
import { LogProcessorService } from '../services/log-processor.service';
import { LogGeneratorService } from '../services/log-generator.service';
import {
  DateRangeDto,
  GenerateSampleLogsDto,
  ProcessFileDto,
} from '../dtos/analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly hllService: HyperLogLogService,
    private readonly logProcessor: LogProcessorService,
    private readonly logGenerator: LogGeneratorService,
  ) {}

  @Post('process-file')
  @HttpCode(HttpStatus.OK)
  async processFile(@Body() dto: ProcessFileDto) {
    return this.logProcessor.processLogFile(dto.filePath);
  }

  @Get('metrics')
  async getMetrics(@Query() query: DateRangeDto) {
    return this.hllService.getMetricsForDateRange(query);
  }

  @Get('metrics/daily/:date')
  async getDailyMetrics(@Param('date') date: string) {
    return this.hllService.getDailyMetrics(date);
  }

  @Get('stats')
  async getStats() {
    return this.hllService.getStats();
  }

  @Post('generate-sample-logs')
  @HttpCode(HttpStatus.OK)
  async generateSampleLogs(
    @Body()
    dto: GenerateSampleLogsDto,
  ) {
    return this.logGenerator.generateSampleLogs(dto);
  }

  @Delete('clear-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearData() {
    this.hllService.clearAll();
  }
}
