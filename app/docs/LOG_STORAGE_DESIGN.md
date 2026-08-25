# AI Hub Log Storage Design

## Overview

This document outlines the log storage architecture for the AI Hub application, covering local development, CloudWatch integration, and long-term S3 archival.

## Storage Strategy

### Three-Tier Approach

```
┌─────────────────────────────────────────────────────────────┐
│                    Tier 1: Hot Storage                       │
│                   (Immediate Access)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Local Files (Development)                           │  │
│  │  - logs/combined.log (all logs)                      │  │
│  │  - logs/error.log (errors only)                      │  │
│  │  Retention: 7 days (5MB max per file)                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CloudWatch Logs (Production)                        │  │
│  │  - /aws/ai-hub/application/{instance-id}/combined    │  │
│  │  - /aws/ai-hub/application/{instance-id}/error       │  │
│  │  Retention: 30 days                                   │  │
│  │  Cost: ~$0.50/GB ingested + $0.03/GB stored          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Tier 2: Warm Storage                       │
│                  (Infrequent Access)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  S3 Standard Storage                                  │  │
│  │  - s3://ai-hub-logs-{account}/cloudwatch-logs/       │  │
│  │  Retention: 90 days                                   │  │
│  │  Cost: ~$0.023/GB/month                              │  │
│  │  Use Case: Compliance, auditing, analysis            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Tier 3: Cold Storage                       │
│                    (Archive Only)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  S3 Glacier                                           │  │
│  │  - Automatic transition after 90 days                │  │
│  │  Retention: 365 days (then deleted)                  │  │
│  │  Cost: ~$0.004/GB/month                              │  │
│  │  Use Case: Long-term compliance, legal hold          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## S3 Bucket Structure

### Folder Organization

```
s3://ai-hub-logs-{account-id}/
│
├── cloudwatch-logs/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── 01/
│   │   │   │   ├── instance-i-abc123_combined_2025-01-01-00.log.gz
│   │   │   │   ├── instance-i-abc123_combined_2025-01-01-01.log.gz
│   │   │   │   └── instance-i-abc123_error_2025-01-01-00.log.gz
│   │   │   ├── 02/
│   │   │   └── ...
│   │   ├── 02/
│   │   └── ...
│   └── ...
│
├── application-logs/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── 01/
│   │   │   │   ├── app-2025-01-01.log.gz
│   │   │   │   └── ...
│   │   │   └── ...
│   │   └── ...
│   └── ...
│
├── access-logs/
│   └── (HTTP access logs if using ALB)
│
└── error-logs/
    └── (Dedicated error log exports)
```

### Naming Convention

**CloudWatch Exports:**
- Format: `instance-{instance-id}_{stream-type}_{timestamp}.log.gz`
- Example: `instance-i-0abc123def456_combined_2025-01-01-00.log.gz`

**Application Logs:**
- Format: `app-{date}.log.gz`
- Example: `app-2025-01-01.log.gz`

**Partitioning:**
- Year/Month/Day hierarchy for efficient querying
- Enables S3 Select and Athena queries
- Simplifies lifecycle management

## Lifecycle Policies

### S3 Lifecycle Rules

```json
{
  "Rules": [
    {
      "Id": "TransitionToGlacier",
      "Status": "Enabled",
      "Prefix": "",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    },
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    }
  ]
}
```

### Retention Summary

| Storage Tier | Retention | Access Time | Cost/GB/Month |
|-------------|-----------|-------------|---------------|
| Local Files | 7 days | Immediate | $0 |
| CloudWatch Logs | 30 days | Immediate | $0.03 |
| S3 Standard | 90 days | Immediate | $0.023 |
| S3 Glacier | 275 days | 3-5 hours | $0.004 |
| **Total** | **365 days** | - | **~$0.057** |

## Cost Analysis

### Monthly Cost Estimate

**Assumptions:**
- Application generates 10 GB of logs per month
- 30-day CloudWatch retention
- 90-day S3 Standard storage
- 275-day Glacier storage

**Breakdown:**
```
CloudWatch Logs:
  Ingestion: 10 GB × $0.50 = $5.00
  Storage: 10 GB × $0.03 = $0.30
  
S3 Standard (first 90 days):
  Storage: 30 GB × $0.023 = $0.69
  
S3 Glacier (days 91-365):
  Storage: 90 GB × $0.004 = $0.36
  
Data Transfer (CloudWatch → S3):
  10 GB × $0.00 = $0.00 (free within same region)

Total Monthly Cost: ~$6.35
```

### Cost Optimization Strategies

1. **Reduce CloudWatch Retention**
   - Change from 30 to 14 days: Save ~$0.15/month
   
2. **Compress Logs**
   - Enable gzip compression: Reduce storage by ~70%
   
3. **Filter Logs**
   - Only send ERROR and WARN to CloudWatch: Reduce ingestion by ~60%
   
4. **Use S3 Intelligent-Tiering**
   - Automatic cost optimization: Save ~15-20%

5. **Implement Log Sampling**
   - Sample INFO logs at 10%: Reduce volume by ~50%

## Query Patterns

### CloudWatch Logs Insights

**Find all errors in last 24 hours:**
```
fields @timestamp, @message, level, correlationId
| filter level = "error"
| sort @timestamp desc
| limit 100
```

**Track user login failures:**
```
fields @timestamp, email, correlationId
| filter message like /Login failed/
| stats count() by email
| sort count desc
```

**Monitor response times:**
```
fields @timestamp, duration, route, statusCode
| filter message like /Request completed/
| stats avg(duration), max(duration), min(duration) by route
```

### S3 Select Queries

**Query compressed logs in S3:**
```sql
SELECT * FROM s3object s 
WHERE s.level = 'error' 
AND s.timestamp > '2025-01-01'
LIMIT 1000
```

### Amazon Athena

**Create table for log analysis:**
```sql
CREATE EXTERNAL TABLE ai_hub_logs (
  timestamp STRING,
  level STRING,
  message STRING,
  correlationId STRING,
  userId INT,
  email STRING
)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
LOCATION 's3://ai-hub-logs-{account-id}/cloudwatch-logs/'
PARTITIONED BY (year STRING, month STRING, day STRING);
```

**Query logs with Athena:**
```sql
SELECT 
  level,
  COUNT(*) as count,
  DATE_TRUNC('hour', CAST(timestamp AS TIMESTAMP)) as hour
FROM ai_hub_logs
WHERE year = '2025' AND month = '01'
GROUP BY level, DATE_TRUNC('hour', CAST(timestamp AS TIMESTAMP))
ORDER BY hour DESC;
```

## Backup and Recovery

### Backup Strategy

1. **S3 Versioning**
   - Enabled on bucket
   - Protects against accidental deletion
   - Automatic version cleanup after 30 days

2. **Cross-Region Replication (Optional)**
   - Replicate to secondary region for disaster recovery
   - Additional cost: ~$0.02/GB transfer + storage in second region

3. **S3 Object Lock (Optional)**
   - Compliance mode for regulatory requirements
   - Prevents deletion for specified retention period

### Recovery Procedures

**Restore from CloudWatch:**
```bash
# Export log group to S3
aws logs create-export-task \
  --log-group-name /aws/ai-hub/application \
  --from $(date -d '7 days ago' +%s)000 \
  --to $(date +%s)000 \
  --destination ai-hub-logs-backup \
  --destination-prefix emergency-restore/
```

**Restore from S3:**
```bash
# Download specific date range
aws s3 sync \
  s3://ai-hub-logs-{account}/cloudwatch-logs/2025/01/15/ \
  ./restored-logs/ \
  --exclude "*" \
  --include "*.log.gz"

# Decompress
gunzip ./restored-logs/*.log.gz
```

**Restore from Glacier:**
```bash
# Initiate restore (takes 3-5 hours)
aws s3api restore-object \
  --bucket ai-hub-logs-{account} \
  --key cloudwatch-logs/2025/01/01/instance-i-abc123_combined_2025-01-01-00.log.gz \
  --restore-request Days=7,GlacierJobParameters={Tier=Standard}

# Check restore status
aws s3api head-object \
  --bucket ai-hub-logs-{account} \
  --key cloudwatch-logs/2025/01/01/instance-i-abc123_combined_2025-01-01-00.log.gz

# Download after restore completes
aws s3 cp \
  s3://ai-hub-logs-{account}/cloudwatch-logs/2025/01/01/instance-i-abc123_combined_2025-01-01-00.log.gz \
  ./restored-logs/
```

## Compliance Considerations

### Data Retention Requirements

**GDPR:**
- Personal data retention: Maximum 365 days (configurable)
- Right to erasure: Implement log filtering for user data
- Data minimization: Only log necessary information

**HIPAA (if applicable):**
- Minimum 6 years retention
- Adjust lifecycle policy accordingly
- Enable encryption at rest and in transit

**SOC 2:**
- Audit trail retention: Minimum 1 year
- Immutable logs: Consider S3 Object Lock
- Access logging: Enable S3 access logs

### Security Measures

1. **Encryption**
   - At rest: AES-256 (S3 default)
   - In transit: TLS 1.2+ (CloudWatch API)
   - Key management: AWS KMS (optional)

2. **Access Control**
   - S3 bucket policy: Deny public access
   - IAM roles: Principle of least privilege
   - CloudWatch: Resource-based policies

3. **Audit Logging**
   - S3 access logs: Track all bucket access
   - CloudTrail: Track API calls
   - VPC Flow Logs: Network-level logging

## Monitoring Log Storage

### CloudWatch Metrics for S3

```bash
# Monitor bucket size
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name BucketSizeBytes \
  --dimensions Name=BucketName,Value=ai-hub-logs-{account} Name=StorageType,Value=StandardStorage \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Average
```

### Alerts

**High Log Volume:**
- Trigger: > 50 GB ingested in 24 hours
- Action: Investigate potential logging loop or attack

**Export Failures:**
- Trigger: CloudWatch export task fails
- Action: Check IAM permissions and S3 bucket policy

**Storage Quota:**
- Trigger: S3 bucket > 1 TB
- Action: Review retention policies and cleanup

## Best Practices

1. **Structured Logging**
   - Use JSON format for easy parsing
   - Include correlation IDs for tracing
   - Add contextual metadata (user ID, session ID)

2. **Log Levels**
   - ERROR: Application errors requiring attention
   - WARN: Potential issues (failed logins, rate limits)
   - INFO: Normal operations (successful requests)
   - DEBUG: Detailed debugging (development only)

3. **Sensitive Data**
   - Never log passwords, tokens, or credit cards
   - Redact PII before logging
   - Use log filtering for compliance

4. **Performance**
   - Async logging to avoid blocking requests
   - Batch CloudWatch log uploads
   - Use log sampling for high-volume endpoints

5. **Cost Management**
   - Regular review of log volume
   - Implement log filtering
   - Use lifecycle policies aggressively
   - Monitor CloudWatch costs in AWS Cost Explorer

## Maintenance Tasks

### Daily
- Monitor CloudWatch Logs ingestion rate
- Check for export task failures

### Weekly
- Review S3 bucket size and growth rate
- Verify lifecycle transitions are working
- Check for any failed Glacier restores

### Monthly
- Analyze log storage costs
- Review and optimize retention policies
- Clean up any orphaned log files
- Update documentation if structure changes

## Future Enhancements

1. **Centralized Logging**
   - Implement ELK stack (Elasticsearch, Logstash, Kibana)
   - Or use AWS OpenSearch Service
   - Real-time log analysis and visualization

2. **Log Aggregation**
   - Combine logs from multiple services
   - Unified search and correlation
   - Cross-service tracing

3. **Machine Learning**
   - Anomaly detection in logs
   - Predictive alerting
   - Automated root cause analysis

4. **Compliance Automation**
   - Automated retention policy enforcement
   - PII detection and redaction
   - Compliance reporting dashboards
