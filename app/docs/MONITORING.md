# AI Hub Monitoring System

## Overview

This document provides a comprehensive guide to the monitoring and logging infrastructure for the AI Hub application. The system uses a combination of AWS CloudWatch, Prometheus, and Grafana to provide real-time monitoring, alerting, and log aggregation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Hub Application                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Express.js  │  │  Prometheus  │  │   Winston    │      │
│  │   Metrics    │──│    Client    │  │    Logger    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           │                    │                    │
           ▼                    ▼                    ▼
    ┌──────────┐         ┌──────────┐        ┌──────────┐
    │   Logs   │         │Prometheus│        │CloudWatch│
    │  (Local) │         │  Server  │        │   Logs   │
    └──────────┘         └──────────┘        └──────────┘
                               │                    │
                               │                    │
                               ▼                    ▼
                         ┌──────────┐        ┌──────────┐
                         │ Grafana  │        │    S3    │
                         │Dashboards│        │  Bucket  │
                         └──────────┘        └──────────┘
```

## Components

### 1. Application Instrumentation

**Prometheus Metrics:**
- HTTP request counter (by method, route, status code)
- HTTP request duration histogram
- Active connections gauge
- Database query metrics
- Business metrics (registrations, logins)

**Winston Logging:**
- Structured JSON logging
- Multiple transports (console, file, CloudWatch)
- Log levels: error, warn, info, debug
- Correlation IDs for request tracing

### 2. Prometheus

**Purpose:** Time-series metrics collection and alerting

**Key Features:**
- Scrapes metrics from application every 15 seconds
- Stores 15 days of metrics data
- Alert rules for application and infrastructure
- PromQL query language for analysis

**Access:** http://localhost:9090

### 3. Grafana

**Purpose:** Metrics visualization and dashboarding

**Key Features:**
- Real-time dashboards
- Pre-built and custom dashboards
- Alert visualization
- Multiple data sources support

**Access:** http://localhost:3001
**Credentials:** admin / admin (change on first login)

### 4. AWS CloudWatch

**Purpose:** Cloud-native monitoring and log aggregation

**Key Features:**
- EC2 instance metrics (CPU, memory, disk)
- Application log aggregation
- Alarms with SNS notifications
- Long-term log storage in S3

### 5. Node Exporter

**Purpose:** System-level metrics collection

**Key Features:**
- CPU, memory, disk, network metrics
- Process and filesystem statistics
- Hardware and OS metrics

**Access:** http://localhost:9100/metrics

## Metrics Reference

### HTTP Metrics

| Metric Name | Type | Description |
|------------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests by method, route, status |
| `http_request_duration_seconds` | Histogram | Request duration in seconds |
| `active_connections` | Gauge | Current active connections |

### Database Metrics

| Metric Name | Type | Description |
|------------|------|-------------|
| `db_queries_total` | Counter | Total database queries by operation and table |
| `db_query_duration_seconds` | Histogram | Query duration in seconds |

### Business Metrics

| Metric Name | Type | Description |
|------------|------|-------------|
| `user_registrations_total` | Counter | Total user registrations (success/failure) |
| `user_logins_total` | Counter | Total login attempts (success/failure) |
| `active_sessions` | Gauge | Current active user sessions |

### System Metrics (Node Exporter)

| Metric Name | Type | Description |
|------------|------|-------------|
| `node_cpu_seconds_total` | Counter | CPU time in seconds by mode |
| `node_memory_MemAvailable_bytes` | Gauge | Available memory in bytes |
| `node_filesystem_avail_bytes` | Gauge | Available filesystem space |
| `node_network_receive_bytes_total` | Counter | Network bytes received |

## Alerts

### Application Alerts

1. **HighErrorRate** - Triggers when error rate exceeds 5% for 5 minutes
2. **HighResponseTime** - Triggers when P95 latency exceeds 1 second for 5 minutes
3. **ServiceDown** - Triggers when application is unreachable for 1 minute
4. **HighLoginFailureRate** - Triggers when login failures exceed 30% for 5 minutes
5. **DatabaseConnectionErrors** - Triggers on database errors

### Infrastructure Alerts

1. **HighCPUUsage** - Triggers when CPU exceeds 80% for 5 minutes
2. **HighMemoryUsage** - Triggers when memory exceeds 80% for 5 minutes
3. **DiskSpaceLow** - Triggers when disk usage exceeds 85%
4. **NodeDown** - Triggers when Node Exporter is unreachable

### CloudWatch Alarms

1. **AIHub-HighCPU** - CPU > 80% for 10 minutes
2. **AIHub-HighMemory** - Memory > 80% for 10 minutes
3. **AIHub-HighDiskUsage** - Disk > 85%
4. **AIHub-HighErrorRate** - 5xx errors > 10 in 5 minutes
5. **AIHub-HighResponseTime** - P95 latency > 1000ms
6. **AIHub-ApplicationDown** - Health check failures

All CloudWatch alarms send notifications to SNS topic `AIHub-Alerts`.

## Health Check Endpoints

### Basic Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-29T05:30:00.000Z",
  "uptime": 3600.5
}
```

### Detailed Health Check
```bash
GET /api/health/detailed
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "dbLatency": "2ms",
  "uptime": 3600.5,
  "memory": {
    "rss": 45678912,
    "heapTotal": 18874368,
    "heapUsed": 12345678
  },
  "timestamp": "2025-12-29T05:30:00.000Z"
}
```

### Metrics Endpoint
```bash
GET /metrics
```

Returns Prometheus-formatted metrics.

## Log Management

### Log Levels

- **error** - Application errors, exceptions
- **warn** - Warning conditions, failed login attempts
- **info** - Normal operations, successful requests
- **debug** - Detailed debugging information

### Log Locations

**Local Development:**
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

**Production (CloudWatch):**
- Log Group: `/aws/ai-hub/application`
- Log Streams: `{instance-id}/combined`, `{instance-id}/error`

**Long-term Storage (S3):**
- Bucket: `ai-hub-logs-{account-id}`
- Path: `cloudwatch-logs/YYYY/MM/DD/`

### Log Format

```json
{
  "timestamp": "2025-12-29 05:30:00",
  "level": "info",
  "message": "User logged in successfully",
  "correlationId": "1735450200000-abc123def",
  "userId": 42,
  "email": "user@example.com"
}
```

## Troubleshooting

### Application Not Reporting Metrics

1. Check if `/metrics` endpoint is accessible:
   ```bash
   curl http://localhost:3000/metrics
   ```

2. Verify Prometheus is scraping:
   - Open http://localhost:9090/targets
   - Check if `ai-hub-app` target is "UP"

3. Check application logs:
   ```bash
   cat logs/combined.log | grep -i error
   ```

### Grafana Not Showing Data

1. Verify Prometheus datasource:
   - Configuration → Data Sources → Prometheus
   - Click "Test" button

2. Check Prometheus is running:
   ```bash
   docker ps | grep prometheus
   ```

3. Verify time range in Grafana matches data availability

### CloudWatch Logs Not Appearing

1. Check IAM permissions for CloudWatch agent
2. Verify log group exists: `/aws/ai-hub/application`
3. Check application environment variables:
   ```bash
   echo $AWS_REGION
   echo $CLOUDWATCH_LOG_GROUP
   ```

### High Memory Usage

1. Check Node.js heap size:
   ```bash
   curl http://localhost:3000/api/health/detailed
   ```

2. Restart application if memory leak suspected:
   ```bash
   pm2 restart ai-hub
   ```

3. Review logs for memory-intensive operations

## Best Practices

### Monitoring

1. **Set up alerts** - Configure email/Slack notifications for critical alerts
2. **Review dashboards daily** - Check for anomalies and trends
3. **Monitor trends** - Look for gradual increases in response time or error rate
4. **Capacity planning** - Use metrics to predict when to scale

### Logging

1. **Use correlation IDs** - Track requests across services
2. **Log context** - Include relevant data (user ID, request ID)
3. **Avoid logging sensitive data** - Never log passwords or tokens
4. **Set appropriate log levels** - Use DEBUG only in development

### Performance

1. **Monitor P95/P99 latency** - Not just averages
2. **Track error rates by endpoint** - Identify problematic routes
3. **Set up SLOs** - Define service level objectives
4. **Regular load testing** - Validate performance under load

## Maintenance

### Daily Tasks

- Review Grafana dashboards for anomalies
- Check CloudWatch alarms
- Verify log aggregation is working

### Weekly Tasks

- Review alert thresholds and adjust if needed
- Check disk space on monitoring servers
- Review slow query logs

### Monthly Tasks

- Analyze trends and capacity planning
- Update dashboards based on new features
- Review and optimize alert rules
- Clean up old logs (automated via S3 lifecycle)

## Support

For issues or questions:
1. Check application logs: `logs/combined.log`
2. Check Prometheus alerts: http://localhost:9090/alerts
3. Review CloudWatch alarms in AWS Console
4. Check this documentation for troubleshooting steps
