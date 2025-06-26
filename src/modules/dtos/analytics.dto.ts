import {
  IsString,
  IsArray,
  IsOptional,
  IsDateString,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';

export class ProcessLogsDto {
  @IsArray()
  logs: any[];
}

export class DateRangeDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class ProcessFileDto {
  @IsString()
  filePath: string;

  @IsOptional()
  @IsNumber()
  batchSize?: number;
}

export class GenerateSampleLogsDto {
  @IsString()
  @IsNotEmpty()
  outputPath: string;

  @IsNumber()
  @IsNotEmpty()
  numberOfLogs: number;

  @IsNumber()
  @IsNotEmpty()
  numberOfDays: number;
}
