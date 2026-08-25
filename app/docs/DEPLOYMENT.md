# AI Hub Deployment Guide

This guide provides step-by-step instructions for deploying the AI Hub application with full monitoring and logging infrastructure.

## Prerequisites

### Local Development
- Node.js 16+ and npm
- Docker and Docker Compose
- Git

### AWS Production
- AWS Account with appropriate permissions
- EC2 instance (t3.medium or larger recommended)
- AWS CLI configured
- SSH access to EC2 instance

## Part 1: Local Development Setup

### 1. Install Dependencies

```bash
cd c:\Users\karla\Downloads\DevOps-Project\AI-Hub
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# For local development, default values are fine
```

### 3. Create Logs Directory

```bash
mkdir logs
```

### 4. Start the Application

```bash
npm start
```

The application will be available at:
- Application: http://localhost:3000
- Health Check: http://localhost:3000/health
- Metrics: http://localhost:3000/metrics

### 5. Start Monitoring Stack

```bash
cd monitoring
docker-compose up -d
```

This starts:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- Node Exporter: http://localhost:9100

### 6. Access Grafana

1. Open http://localhost:3001
2. Login with admin/admin
3. Change password when prompted
4. Import dashboards (see `monitoring/grafana/dashboards/README.md`)

### 7. Verify Metrics Collection

1. Open Prometheus: http://localhost:9090/targets
2. Verify all targets show "UP" status
3. Open Grafana and check dashboards show data

## Part 2: AWS Infrastructure with Terraform

### 1. Configure Terraform Variables

```bash
cd c:\Users\karla\Downloads\DevOps-Project\AI-Hub\terraform

# Copy example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your email and settings
# Minimum required: alert_email = "your-email@example.com"
```

### 2. Initialize and Apply Terraform

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply

# Type 'yes' when prompted
```

**What Terraform Creates:**
- CloudWatch Log Group: `/aws/ai-hub/application`
- SNS Topic: `ai-hub-alerts` with email subscription
- S3 Bucket: `ai-hub-logs-{account-id}` with lifecycle policies
- IAM Role & Instance Profile for EC2 instances
- CloudWatch Alarms for CPU, Memory, Disk, Errors, Response Time
- CloudWatch Dashboard

### 3. Confirm SNS Email Subscription

Check your email for an AWS SNS subscription confirmation and click the link.

### 4. Get Terraform Outputs

```bash
# View all outputs
terraform output

# Get specific values for deployment
terraform output iam_instance_profile_name
terraform output s3_logs_bucket_name
terraform output sns_topic_arn
```

Save these values - you'll need them for EC2 deployment.

## Part 3: EC2 Deployment

### 1. Launch EC2 Instance

```bash
# Launch instance with IAM role
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name YOUR_KEY_PAIR \
  --security-group-ids sg-XXXXXXXXX \
  --iam-instance-profile Name=AIHub-EC2-Profile \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=AIHub-Production}]'
```

### 2. SSH into EC2 Instance

```bash
ssh -i YOUR_KEY.pem ec2-user@EC2_PUBLIC_IP
```

### 3. Install Node.js

```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### 4. Install CloudWatch Agent

```bash
# Download CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm

# Install agent
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Copy configuration (upload from local machine first)
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/
sudo cp cloudwatch-config.json /opt/aws/amazon-cloudwatch-agent/etc/config.json

# Start CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Verify agent is running
sudo systemctl status amazon-cloudwatch-agent
```

### 5. Deploy Application

```bash
# Clone repository
git clone https://github.com/ganeshkarlapudi/AI-Hub.git
cd AI-Hub

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3000
NODE_ENV=production
DB_PATH=./database.sqlite
SESSION_SECRET=$(openssl rand -base64 32)
LOG_LEVEL=info
AWS_REGION=us-east-1
CLOUDWATCH_LOG_GROUP=/aws/ai-hub/application
CLOUDWATCH_LOG_STREAM=app
METRICS_ENABLED=true
EOF

# Create logs directory
mkdir -p /var/log/ai-hub
sudo chown ec2-user:ec2-user /var/log/ai-hub

# Update log paths in server.js to use /var/log/ai-hub
```

### 6. Install PM2 for Process Management

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application with PM2
pm2 start server.js --name ai-hub

# Configure PM2 to start on boot
pm2 startup
pm2 save

# View logs
pm2 logs ai-hub
```

### 7. Install Docker for Monitoring Stack

```bash
# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes
exit
# SSH back in

# Start monitoring stack
cd AI-Hub/monitoring
docker-compose up -d

# Verify containers are running
docker ps
```

### 8. Configure Security Group

Ensure your EC2 security group allows:
- Port 22 (SSH) from your IP
- Port 3000 (Application) from load balancer or 0.0.0.0/0
- Port 9090 (Prometheus) from your IP only
- Port 3001 (Grafana) from your IP only
- Port 9100 (Node Exporter) from Prometheus only

## Part 4: Update EC2 Instances with Terraform

### 1. Add EC2 Instance IDs to Terraform

After launching your EC2 instances, update `terraform/terraform.tfvars`:

```hcl
ec2_instance_ids = [
  "i-0123456789abcdef0"  # Replace with your actual instance ID
]
```

### 2. Apply Terraform Changes

```bash
cd terraform
terraform apply
```

This will create CloudWatch alarms for your EC2 instances automatically.

### 3. Verify Alarms

```bash
# List all alarms
terraform output alarm_names

# Or check in AWS Console
# CloudWatch → Alarms
```

## Part 5: Verification

### 1. Test Application

```bash
# Health check
curl http://EC2_PUBLIC_IP:3000/health

# Detailed health check
curl http://EC2_PUBLIC_IP:3000/api/health/detailed

# Metrics endpoint
curl http://EC2_PUBLIC_IP:3000/metrics
```

### 2. Verify CloudWatch Metrics

1. Open AWS Console → CloudWatch → Metrics
2. Navigate to `AIHub/Production` namespace
3. Verify metrics are being reported

### 3. Verify CloudWatch Logs

1. Open AWS Console → CloudWatch → Log groups
2. Navigate to `/aws/ai-hub/application`
3. Check log streams for recent entries

### 4. Test Alarms

```bash
# Generate high CPU load (for testing)
stress --cpu 4 --timeout 300s

# Check if alarm triggered
aws cloudwatch describe-alarms --state-value ALARM

# Check email for SNS notification
```

### 5. Verify Prometheus

1. Open http://EC2_PUBLIC_IP:9090/targets
2. Verify all targets are "UP"
3. Run test query: `rate(http_requests_total[5m])`

### 6. Verify Grafana

1. Open http://EC2_PUBLIC_IP:3001
2. Login and import dashboards
3. Verify data is displaying

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs ai-hub

# Check if port is in use
sudo netstat -tulpn | grep 3000

# Restart application
pm2 restart ai-hub
```

### CloudWatch Agent Not Running

```bash
# Check status
sudo systemctl status amazon-cloudwatch-agent

# View logs
sudo tail -f /opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log

# Restart agent
sudo systemctl restart amazon-cloudwatch-agent
```

### Metrics Not Appearing in CloudWatch

1. Verify IAM role is attached to EC2 instance
2. Check CloudWatch agent configuration
3. Verify log paths exist and are writable
4. Check agent logs for errors

### Docker Containers Not Starting

```bash
# Check Docker status
sudo systemctl status docker

# View container logs
docker logs ai-hub-prometheus
docker logs ai-hub-grafana

# Restart containers
docker-compose restart
```

## Maintenance

### Daily
- Monitor Grafana dashboards
- Check CloudWatch alarms
- Review application logs

### Weekly
- Review disk space: `df -h`
- Check PM2 status: `pm2 status`
- Review slow queries and errors

### Monthly
- Update dependencies: `npm update`
- Review and optimize alert thresholds
- Clean up old logs (automated via S3 lifecycle)
- Security patches: `sudo yum update -y`

## Scaling Considerations

### Horizontal Scaling
- Use Application Load Balancer
- Deploy multiple EC2 instances
- Update Prometheus to scrape all instances
- Use CloudWatch for aggregated metrics

### Vertical Scaling
- Upgrade to larger instance type
- Increase CloudWatch agent collection interval
- Optimize database queries

## Security Best Practices

1. **Never expose Prometheus/Grafana publicly** - Use VPN or SSH tunnel
2. **Change default Grafana password** immediately
3. **Rotate SESSION_SECRET** regularly
4. **Enable HTTPS** using Let's Encrypt or AWS Certificate Manager
5. **Restrict security group** rules to minimum required
6. **Enable CloudTrail** for audit logging
7. **Use AWS Secrets Manager** for sensitive configuration

## Cost Optimization

1. **CloudWatch Logs** - Set appropriate retention periods
2. **S3 Storage** - Use lifecycle policies to transition to Glacier
3. **EC2 Instance** - Use Reserved Instances for production
4. **CloudWatch Metrics** - Use basic monitoring (5-min intervals) if detailed not needed
5. **Prometheus Retention** - Keep only 15 days locally, use long-term storage if needed

## Next Steps

1. Set up automated backups for database
2. Configure SSL/TLS certificates
3. Set up CI/CD pipeline
4. Implement log analysis with CloudWatch Insights
5. Create custom CloudWatch dashboards
6. Set up alerting escalation policies
7. Implement distributed tracing with X-Ray
