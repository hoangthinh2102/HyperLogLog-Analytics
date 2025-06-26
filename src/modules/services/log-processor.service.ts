import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HyperLogLogService } from './hyperloglog.service';
import * as fs from 'fs';
import { pipeline, Transform } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

@Injectable()
export class LogProcessorService {
  private readonly logger = new Logger(LogProcessorService.name);
  private readonly MAX_CONCURRENT_BATCHES = 8;

  constructor(private readonly hllService: HyperLogLogService) {}

  private createLineSplitter() {
    let buffer = '';

    return new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        const data = buffer + chunk.toString();
        const lines = data.split('\n');

        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            this.push(line);
          }
        }

        callback();
      },

      flush(callback) {
        if (buffer.trim()) {
          this.push(buffer);
        }
        callback();
      },
    });
  }

  private createBatcher(batchSize: number) {
    let batch: string[] = [];

    return new Transform({
      objectMode: true,

      transform(line: string, _encoding, callback) {
        batch.push(line);

        if (batch.length >= batchSize) {
          this.push([...batch]);
          batch = [];
        }

        callback();
      },

      flush(callback) {
        if (batch.length > 0) {
          this.push(batch);
        }
        callback();
      },
    });
  }

  private createJSONParser() {
    let errorCount = 0;

    return new Transform({
      objectMode: true,

      transform(lines: string[], _encoding, callback) {
        const logs = [];

        for (const line of lines) {
          try {
            logs.push(JSON.parse(line));
          } catch (error) {
            errorCount++;
          }
        }

        if (logs.length > 0) {
          this.push({ logs, errors: errorCount });
        }

        callback();
      },
    });
  }

  async processLogFile(filePath: string, batchSize: number = 100000) {
    const startTime = Date.now();
    let totalProcessed = 0;
    let totalErrors = 0;

    this.logger.log(`Starting to process file: ${filePath}`);

    const stats = fs.statSync(filePath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    this.logger.log(`File size: ${fileSizeMB} MB`);

    // Process tracking
    const processingPromises: Promise<void>[] = [];
    let activePromises = 0;

    // Create processing pipeline
    const processStream = new Transform({
      objectMode: true,

      transform: async (
        data: { logs: any[]; errors: number },
        _encoding,
        callback,
      ) => {
        const { logs, errors } = data;
        totalErrors = errors;

        // Wait if too many concurrent processes
        while (activePromises >= this.MAX_CONCURRENT_BATCHES) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        // Process batch asynchronously
        activePromises++;
        const promise = this.hllService
          .processLogBatch(logs)
          .then(() => {
            totalProcessed += logs.length;
            if (totalProcessed % 100000 === 0) {
              const elapsed = (Date.now() - startTime) / 1000;
              const speed = Math.round(totalProcessed / elapsed);
              this.logger.log(
                `Processed ${totalProcessed} logs (${speed} logs/sec)`,
              );
            }
          })
          .finally(() => {
            activePromises--;
          });

        processingPromises.push(promise);
        callback();
      },
    });

    try {
      await pipelineAsync(
        fs.createReadStream(filePath, {
          highWaterMark: 256 * 1024,
        }),
        this.createLineSplitter(),
        this.createBatcher(batchSize),
        this.createJSONParser(),
        processStream,
      );

      await Promise.all(processingPromises);

      const timeElapsed = (Date.now() - startTime) / 1000;
      const logsPerSecond = Math.round(totalProcessed / timeElapsed);

      this.logger.log(
        `Processing completed: ${totalProcessed} logs, ` +
          `${totalErrors} errors, ${timeElapsed.toFixed(2)}s, ` +
          `${logsPerSecond} logs/sec`,
      );

      return {
        totalProcessed,
        timeElapsed,
        errors: totalErrors,
        logsPerSecond,
      };
    } catch (error) {
      this.logger.error(`Processing failed: ${error.message}`);
      throw new BadRequestException(error);
    }
  }
}
