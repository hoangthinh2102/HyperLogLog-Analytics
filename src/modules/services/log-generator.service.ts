import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { subDays } from 'date-fns';
import { GenerateSampleLogsDto } from '../dtos/analytics.dto';

@Injectable()
export class LogGeneratorService {
  private readonly logger = new Logger(LogGeneratorService.name);

  generateSampleLogs(
    data: GenerateSampleLogsDto
  ) {
    const {outputPath, numberOfDays, numberOfLogs} = data;

    this.logger.log(`Generating ${numberOfLogs} sample logs over ${numberOfDays} days`);
    
    const writeStream = fs.createWriteStream(outputPath);
    const baseDate = new Date();
    
    const userPool = Array.from({ length: 50000 }, (_, i) => `user_${i}`);
    const devicePool = Array.from({ length: 60000 }, (_, i) => `device_${i}`);
    const rolePool = ['warrior', 'mage', 'archer', 'priest', 'rogue'];
    
    let generatedCount = 0;
    const batchSize = 10000;
    
    for (let i = 0; i < numberOfLogs; i++) {
      const dayOffset = Math.floor(Math.random() * numberOfDays);
      const date = subDays(baseDate, dayOffset);
      const timestamp = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60)
      ).toISOString();
      
      const userId = userPool[Math.floor(Math.random() * userPool.length)];
      const deviceId = devicePool[Math.floor(Math.random() * devicePool.length)];
      
      const eventType = Math.random();
      let log: any;
      
      if (eventType < 0.6) {
        // 60% login events
        log = {
          event: 'login',
          user_id: userId,
          device_id: deviceId,
          timestamp
        };
      } else if (eventType < 0.85) {
        // 25% open_app events
        log = {
          event: 'open_app',
          user_id: userId,
          device_id: deviceId,
          timestamp
        };
      } else {
        // 15% set_role events
        log = {
          event: 'set_role',
          user_id: userId,
          role_id: rolePool[Math.floor(Math.random() * rolePool.length)],
          timestamp
        };
      }
      
      writeStream.write(JSON.stringify(log) + '\n');
      generatedCount++;
      
      if (generatedCount % batchSize === 0) {
        this.logger.log(`Generated ${generatedCount} logs...`);
      }
    }
    
    writeStream.end();
    this.logger.log(`Sample log generation completed: ${outputPath}`);

    return {
      outputPath,
      numberOfLogs,
      numberOfDays
    };
  }
}