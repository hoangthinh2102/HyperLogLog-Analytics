export interface LogEvent {
  event: string;
  user_id?: string;
  device_id?: string;
  timestamp: string;
  role_id?: string;
}

export interface DailyMetrics {
  date: string;
  nru: number;
  nrd: number;
  rr1: number;
}

export interface ProcessingResult {
  totalProcessed: number;
  timeElapsed: number;
  errors: number;
}
