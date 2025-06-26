# HyperLogLog Analytics Service

A high-performance analytics service using HyperLogLog for processing large-scale log data (1M+ records) with minimal memory usage.

## Features

- **NRU (New Register User)**: Track new users by user_id
- **NRD (New Register Device)**: Track new devices by device_id  
- **RR1 (Retention Rate Day 1)**: Calculate day-1 retention rate
- **Memory Efficient**: Uses HyperLogLog algorithm (~16KB for millions of unique values)
- **Batch Processing**: Handle 1M+ logs efficiently
- **File Upload**: Support for uploading and processing large log files
- **Sample Data Generator**: Generate test data for development

## Installation

yarn

## Running the Application

# Development
yarn start:dev

## API Endpoints

### Process Logs Directly
\`\`\`bash
POST /analytics/process-logs
Content-Type: application/json

{
  "logs": [
    {
      "event": "login",
      "user_id": "user123",
      "device_id": "deviceA",
      "timestamp": "2025-04-10T08:00:00Z"
    }
  ]
}
\`\`\`

### Upload and Process Log File
\`\`\`bash
POST /analytics/upload-and-process
Content-Type: multipart/form-data

file: <your-log-file.json>
\`\`\`

### Process Existing File
\`\`\`bash
POST /analytics/process-file
Content-Type: application/json

{
  "filePath": "/path/to/your/log-file.json",
  "batchSize": 10000
}
\`\`\`

### Get Metrics for Date Range
\`\`\`bash
GET /analytics/metrics?startDate=2025-04-01&endDate=2025-04-30
\`\`\`

### Get Daily Metrics
\`\`\`bash
GET /analytics/metrics/daily/2025-04-10
\`\`\`

### Get Overall Statistics
\`\`\`bash
GET /analytics/stats
\`\`\`

### Generate Sample Logs
\`\`\`bash
POST /analytics/generate-sample-logs
Content-Type: application/json

{
  "outputPath": "./sample-logs.json",
  "numberOfLogs": 1000000,
  "numberOfDays": 30
}
\`\`\`

### Clear All Data
\`\`\`bash
DELETE /analytics/clear-data
\`\`\`

## Log File Format

The service expects log files in JSONL format (one JSON object per line):

\`\`\`json
{"event":"login","user_id":"user123","device_id":"deviceA","timestamp":"2025-04-10T08:00:00Z"}
{"event":"open_app","user_id":"user123","device_id":"deviceA","timestamp":"2025-04-10T08:01:00Z"}
{"event":"set_role","user_id":"user123","role_id":"warrior","timestamp":"2025-04-10T08:05:00Z"}
\`\`\`

## Performance

- Processes 1M logs in ~30-60 seconds (depending on hardware)
- Memory usage: ~100-200MB for 1M logs
- HyperLogLog accuracy: ~99.2% (0.81% standard error)

## Example Usage

1. Generate sample data:
\`\`\`bash
curl -X POST http://localhost:3000/analytics/generate-sample-logs \
  -H "Content-Type: application/json" \
  -d '{"numberOfLogs": 1000000}'
\`\`\`

2. Process the generated file:
\`\`\`bash
curl -X POST http://localhost:3000/analytics/process-file \
  -H "Content-Type: application/json" \
  -d '{"filePath": "./sample-logs.json"}'
\`\`\`

3. Get metrics:
\`\`\`bash
curl http://localhost:3000/analytics/metrics?startDate=2025-04-01&endDate=2025-06-30
\`\`\`