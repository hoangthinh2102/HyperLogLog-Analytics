import { Injectable, Logger } from '@nestjs/common';
import { HyperLogLog } from 'bloom-filters';
import { format, addDays, parseISO } from 'date-fns';
import { DateRangeDto } from '../dtos/analytics.dto';
import { LogEvent, DailyMetrics } from '../interfaces/log-event.interface';

@Injectable()
export class HyperLogLogService {
  private readonly logger = new Logger(HyperLogLogService.name);
  private readonly precision = 14; // Standard error ~0.81%
  
  // HLL storage
  private dailyUserHLLs: Map<string, HyperLogLog> = new Map();
  private dailyDeviceHLLs: Map<string, HyperLogLog> = new Map();
  private allTimeUserHLL: HyperLogLog;
  private allTimeDeviceHLL: HyperLogLog;
  
  // User tracking for RR1
  private usersByDate: Map<string, Set<string>> = new Map();
  private newUsersByDate: Map<string, Set<string>> = new Map();
  private allUsers: Set<string> = new Set();
  
  constructor() {
    this.initialize();
  }

  private initialize() {
    this.allTimeUserHLL = new HyperLogLog(Math.pow(2, this.precision));
    this.allTimeDeviceHLL = new HyperLogLog(Math.pow(2, this.precision));
    this.logger.log('HyperLogLog service initialized');
  }

  private getDateFromTimestamp(timestamp: string) {
    return format(parseISO(timestamp), 'yyyy-MM-dd');
  }

  async processLogBatch(logs: LogEvent[]) {
    const logsByDate = new Map<string, LogEvent[]>();
    
    for (const log of logs) {
      try {
        const date = this.getDateFromTimestamp(log.timestamp);
        if (!logsByDate.has(date)) {
          logsByDate.set(date, []);
        }
        logsByDate.get(date).push(log);
      } catch (error) {
        this.logger.error(`Error processing log: ${error.message}`);
      }
    }
    
    for (const [date, dateLogs] of logsByDate) {
      if (!this.dailyUserHLLs.has(date)) {
        this.dailyUserHLLs.set(date, new HyperLogLog(Math.pow(2, this.precision)));
      }
      if (!this.dailyDeviceHLLs.has(date)) {
        this.dailyDeviceHLLs.set(date, new HyperLogLog(Math.pow(2, this.precision)));
      }
      
      const dailyUserHLL = this.dailyUserHLLs.get(date);
      const dailyDeviceHLL = this.dailyDeviceHLLs.get(date);
      
      // Process all logs for this date
      for (const log of dateLogs) {
        if (log.event === 'login') {
          if (log.user_id) {
            // Update HLLs
            dailyUserHLL.update(log.user_id);
            this.allTimeUserHLL.update(log.user_id);
            
            // Track for RR1
            if (!this.usersByDate.has(date)) {
              this.usersByDate.set(date, new Set());
            }
            this.usersByDate.get(date).add(log.user_id);
            
            // Track new users
            if (!this.allUsers.has(log.user_id)) {
              this.allUsers.add(log.user_id);
              if (!this.newUsersByDate.has(date)) {
                this.newUsersByDate.set(date, new Set());
              }
              this.newUsersByDate.get(date).add(log.user_id);
            }
          }
          
          if (log.device_id) {
            dailyDeviceHLL.update(log.device_id);
            this.allTimeDeviceHLL.update(log.device_id);
          }
        }
      }
    }
  }

  async calculateNRU(date: string) {
    const newUsers = this.newUsersByDate.get(date);
    return newUsers ? newUsers.size : 0;
  }

  async calculateNRD(date: string) {
    const dailyHLL = this.dailyDeviceHLLs.get(date);
    if (!dailyHLL) return 0;
    
    const previousDaysHLL = new HyperLogLog(Math.pow(2, this.precision));
    
    for (const [d, hll] of this.dailyDeviceHLLs.entries()) {
      if (d < date) {
        previousDaysHLL.merge(hll);
      }
    }
    
    const todayCount = dailyHLL.count();
    const mergedHLL = new HyperLogLog(Math.pow(2, this.precision));
    mergedHLL.merge(previousDaysHLL);
    mergedHLL.merge(dailyHLL);
    const totalCount = mergedHLL.count();
    const previousCount = previousDaysHLL.count();
    
    return Math.max(0, totalCount - previousCount);
  }

  async calculateRR1(date: string) {
    const previousDate = format(addDays(parseISO(date), -1), 'yyyy-MM-dd');
    
    const newUsersYesterday = this.newUsersByDate.get(previousDate);
    if (!newUsersYesterday || newUsersYesterday.size === 0) return 0;
    
    const todayUsers = this.usersByDate.get(date) || new Set();
    
    let returningNewUsers = 0;
    for (const userId of newUsersYesterday) {
      if (todayUsers.has(userId)) {
        returningNewUsers++;
      }
    }
    
    return (returningNewUsers / newUsersYesterday.size) * 100;
  }

  async getDailyMetrics(date: string) {
    const nru = await this.calculateNRU(date);
    const nrd = await this.calculateNRD(date);
    const rr1 = await this.calculateRR1(date);
    
    return {
      date,
      nru: Math.round(nru),
      nrd: Math.round(nrd),
      rr1: Math.round(rr1 * 100) / 100
    };
  }

  async getMetricsForDateRange(query: DateRangeDto) {
    const { startDate, endDate } = query;
    const metrics: DailyMetrics[] = [];
    let currentDate = parseISO(startDate);
    const end = parseISO(endDate);
    
    while (currentDate <= end) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dailyMetrics = await this.getDailyMetrics(dateStr);
      metrics.push(dailyMetrics);
      currentDate = addDays(currentDate, 1);
    }
    
    return metrics;
  }

  getStats() {
    return {
      totalUsers: this.allUsers.size,
      totalDays: this.dailyUserHLLs.size,
      estimatedUniqueUsers: Math.round(this.allTimeUserHLL.count()),
      estimatedUniqueDevices: Math.round(this.allTimeDeviceHLL.count())
    };
  }

  clearAll() {
    this.dailyUserHLLs.clear();
    this.dailyDeviceHLLs.clear();
    this.usersByDate.clear();
    this.newUsersByDate.clear();
    this.allUsers.clear();
    this.initialize();
    this.logger.log('All data cleared');
  }
}