### HyperLogLog Analytics Service
A high-performance analytics service using HyperLogLog for processing large-scale log data (1M+ records) with minimal memory usage.

### Features
- **NRU (New Register User)**: Track new users by user_id
- **NRD (New Register Device)**: Track new devices by device_id  
- **RR1 (Retention Rate Day 1)**: Calculate day-1 retention rate
- **Memory Efficient**: Uses HyperLogLog algorithm (~16KB for millions of unique values)
- **Batch Processing**: Handle 1M+ logs efficiently
- **File Upload**: Support for uploading and processing large log files
- **Sample Data Generator**: Generate test data for development

### Installation
yarn

## Running the Application
yarn start:dev


### Process Existing File
curl --location 'http://localhost:3000/analytics/generate-sample-logs' \
--header 'Content-Type: application/json' \
--data '{
    "numberOfLogs": 1000000,
    "outputPath": "./sample-logs.json",
    "numberOfDays": 30
}'

### Get Metrics for Date Range
curl --location 'http://localhost:3000/analytics/metrics?startDate=2025-05-01&endDate=2025-06-01'

### Generate Sample Logs
curl --location 'http://localhost:3000/analytics/generate-sample-logs' \
--header 'Content-Type: application/json' \
--data '{
    "numberOfLogs": 1000000,
    "outputPath": "./sample-logs.json",
    "numberOfDays": 30
}'

### Clear All Data
curl --location --request DELETE 'http://localhost:3000/analytics/clear-data'

## Log File Format
The service expects log files in JSONL format (one JSON object per line):
{"event":"login","user_id":"user123","device_id":"deviceA","timestamp":"2025-04-10T08:00:00Z"}
{"event":"open_app","user_id":"user123","device_id":"deviceA","timestamp":"2025-04-10T08:01:00Z"}
{"event":"set_role","user_id":"user123","role_id":"warrior","timestamp":"2025-04-10T08:05:00Z"}


## API Testing
Postman
