# Jenkins CI/CD Pipeline Documentation

Complete guide for setting up and using Jenkins CI/CD pipeline for the AI-Hub application.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Pipeline Stages](#pipeline-stages)
- [Configuration](#configuration)
- [Deployment Environments](#deployment-environments)
- [Monitoring Integration](#monitoring-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The Jenkins pipeline automates the entire build, test, and deployment workflow for the AI-Hub application. It includes:

- **Automated Builds**: Triggered by git commits or manual execution
- **Code Quality Checks**: ESLint and security scanning
- **Docker Integration**: Build and push Docker images
- **Multi-Environment Deployment**: Support for dev, staging, and production
- **Health Verification**: Automated post-deployment checks
- **Monitoring Integration**: Prometheus and Grafana validation

## Prerequisites

### Jenkins Server Requirements

- **Jenkins**: Version 2.387+ (LTS recommended)
- **Java**: JDK 11 or higher
- **Docker**: Version 20.10+ with Docker Compose
- **Git**: Version 2.0+
- **Node.js**: Version 18+ (for local testing)

### Required Jenkins Plugins

Install these plugins via Jenkins → Manage Jenkins → Plugins:

```
- Docker Pipeline (docker-workflow)
- Git Plugin (git)
- Pipeline (workflow-aggregator)
- Credentials Binding (credentials-binding)
- Timestamper (timestamper)
- Blue Ocean (blueocean) - Optional but recommended
```

### System Requirements

- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 20GB+ free space for Docker images and build artifacts

## Quick Start

### Option 1: Use Existing Jenkins Server

1. **Install Required Plugins**
   ```bash
   # Via Jenkins CLI
   java -jar jenkins-cli.jar -s http://localhost:8080/ install-plugin \
     docker-workflow git workflow-aggregator credentials-binding timestamper
   ```

2. **Create Pipeline Job**
   - Navigate to Jenkins Dashboard
   - Click "New Item"
   - Enter name: `AI-Hub-Pipeline`
   - Select "Pipeline" type
   - Click OK

3. **Configure Pipeline**
   - Under "Pipeline" section:
     - Definition: `Pipeline script from SCM`
     - SCM: `Git`
     - Repository URL: Your repository URL
     - Branch: `*/main` (or your default branch)
     - Script Path: `Jenkinsfile`
   - Click Save

4. **Configure Credentials** (see [Configuration](#configuration) section)

5. **Run Pipeline**
   - Click "Build Now"
   - Monitor progress in Blue Ocean or Console Output

### Option 2: Run Jenkins Locally with Docker

1. **Start Jenkins**
   ```bash
   cd .jenkins
   docker-compose -f docker-compose.jenkins.yml up -d
   ```

2. **Get Initial Admin Password**
   ```bash
   docker exec jenkins-master cat /var/jenkins_home/secrets/initialAdminPassword
   ```

3. **Access Jenkins**
   - Open browser: http://localhost:8080
   - Enter admin password
   - Install suggested plugins
   - Create admin user

4. **Configure Pipeline** (follow steps from Option 1)

## Pipeline Stages

### 1. Checkout
**Purpose**: Clone repository and display build information

**Actions**:
- Checkout code from Git
- Display build number, branch, commit hash
- Set environment variables

**Duration**: ~10 seconds

### 2. Install Dependencies
**Purpose**: Install Node.js dependencies

**Actions**:
- Run `npm ci` for clean install
- Display Node.js and npm versions
- Cache dependencies for faster builds

**Duration**: ~30-60 seconds (first run), ~10 seconds (cached)

### 3. Code Quality & Security (Parallel)
**Purpose**: Ensure code quality and security standards

**Actions**:
- **Lint**: Run ESLint for code quality
- **Security Scan**: Run npm audit for vulnerabilities

**Duration**: ~20-30 seconds

**Note**: These stages run in parallel for faster execution

### 4. Build Docker Image
**Purpose**: Create Docker images with proper tagging

**Actions**:
- Build Docker image using Dockerfile
- Tag with build number and git commit hash
- Tag as `latest`
- Display image size and metadata

**Duration**: ~2-5 minutes (first run), ~30 seconds (cached layers)

### 5. Test (Parallel)
**Purpose**: Validate application functionality

**Actions**:
- **Unit Tests**: Run npm test suite
- **Container Health Check**: Start test container and verify health endpoint

**Duration**: ~30-60 seconds

### 6. Push to Registry
**Purpose**: Push Docker images to registry

**Conditions**: Only runs on `main`, `develop`, or `staging` branches

**Actions**:
- Login to Docker registry
- Tag images with registry prefix
- Push images to registry
- Logout from registry

**Duration**: ~1-3 minutes (depends on image size and network)

### 7. Deploy
**Purpose**: Deploy application to target environment

**Conditions**: Only runs on `main` or `develop` branches

**Actions**:
- Determine deployment environment (production/staging)
- Run deployment script
- Update Docker Compose services
- Verify containers are running

**Duration**: ~1-2 minutes

### 8. Post-Deploy Verification
**Purpose**: Ensure deployment was successful

**Conditions**: Only runs after successful deployment

**Actions**:
- Check application health endpoint
- Verify metrics endpoint
- Check Prometheus targets
- Validate monitoring stack

**Duration**: ~30 seconds

## Configuration

### Environment Variables

Configure in Jenkins job → Configure → Pipeline → Environment Variables:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DOCKER_REGISTRY` | Docker registry URL | `docker.io/username` | Yes |
| `DOCKER_CREDENTIALS` | Registry credentials ID | `docker-hub-creds` | Yes |
| `AWS_REGION` | AWS region (if using ECR) | `us-east-1` | No |
| `PROMETHEUS_URL` | Prometheus URL | `http://localhost:9090` | No |
| `GRAFANA_URL` | Grafana URL | `http://localhost:3001` | No |

### Credentials Setup

#### Docker Registry Credentials

1. Navigate to: Jenkins → Manage Jenkins → Credentials → Global
2. Click "Add Credentials"
3. Configure:
   - **Kind**: Username with password
   - **Scope**: Global
   - **Username**: Your Docker Hub username
   - **Password**: Your Docker Hub password or access token
   - **ID**: `docker-registry-credentials`
   - **Description**: Docker Hub Credentials

#### Docker Registry URL

1. Add another credential:
   - **Kind**: Secret text
   - **Secret**: `docker.io/your-username` (or ECR URL)
   - **ID**: `docker-registry-url`
   - **Description**: Docker Registry URL

#### AWS Credentials (Optional, for ECR)

1. Add credential:
   - **Kind**: AWS Credentials
   - **Access Key ID**: Your AWS access key
   - **Secret Access Key**: Your AWS secret key
   - **ID**: `aws-credentials`
   - **Description**: AWS Credentials for ECR

### Webhook Configuration

#### GitHub Webhook

1. Go to GitHub repository → Settings → Webhooks
2. Click "Add webhook"
3. Configure:
   - **Payload URL**: `http://your-jenkins-url/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: Just the push event
   - **Active**: ✓

#### GitLab Webhook

1. Go to GitLab repository → Settings → Integrations
2. Configure Jenkins CI:
   - **Jenkins URL**: `http://your-jenkins-url`
   - **Project name**: `AI-Hub-Pipeline`
   - **Token**: Generate in Jenkins job configuration
   - **Push events**: ✓

## Deployment Environments

### Development
- **Branch**: `develop` or feature branches
- **Trigger**: Manual or webhook
- **Deployment**: Staging server
- **Replicas**: 1
- **Health Checks**: Basic

### Staging
- **Branch**: `develop`
- **Trigger**: Automatic on merge
- **Deployment**: Staging server
- **Replicas**: 2
- **Health Checks**: Full suite

### Production
- **Branch**: `main`
- **Trigger**: Manual approval required
- **Deployment**: Production server
- **Replicas**: 3
- **Health Checks**: Full suite + monitoring validation
- **Backup**: Automatic backup before deployment
- **Rollback**: Available via previous image tags

## Monitoring Integration

### Prometheus Integration

The pipeline verifies Prometheus is scraping metrics:

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify application metrics
curl http://localhost:3000/metrics
```

### Grafana Dashboards

Access Grafana at http://localhost:3001 to monitor:
- Build success/failure rates
- Deployment frequency
- Application performance metrics
- Container resource usage

### CloudWatch Integration (AWS)

If deployed on AWS:
- Logs automatically pushed to CloudWatch
- Alarms configured for critical metrics
- SNS notifications for failures

## Troubleshooting

### Build Fails at Docker Stage

**Symptom**: `permission denied while trying to connect to the Docker daemon socket`

**Solution**:
```bash
# Add Jenkins user to docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Tests Fail in Container

**Symptom**: Container health check fails

**Solution**:
1. Check container logs:
   ```bash
   docker logs ai-hub-test-<build-number>
   ```
2. Verify environment variables are set correctly
3. Check if port 3100 is available

### Push to Registry Fails

**Symptom**: `unauthorized: authentication required`

**Solution**:
1. Verify credentials in Jenkins
2. Test login manually:
   ```bash
   docker login -u username -p password registry-url
   ```
3. Check credential ID matches Jenkinsfile

### Deployment Fails

**Symptom**: Containers don't start after deployment

**Solution**:
1. Check Docker Compose logs:
   ```bash
   docker-compose logs
   ```
2. Verify environment files exist (`.env`, `.env.production`)
3. Check if ports are already in use
4. Verify Docker images were pushed successfully

### Webhook Not Triggering Builds

**Symptom**: Commits don't trigger Jenkins builds

**Solution**:
1. Verify webhook URL is correct
2. Check Jenkins logs: `/var/log/jenkins/jenkins.log`
3. Test webhook manually from GitHub/GitLab
4. Ensure Jenkins is accessible from internet (if using cloud Git)

## Best Practices

### 1. Use Credentials Manager
❌ **Don't**: Hardcode secrets in Jenkinsfile
```groovy
environment {
    DOCKER_PASSWORD = "mypassword123"  // BAD!
}
```

✅ **Do**: Use Jenkins credentials
```groovy
environment {
    DOCKER_CREDENTIALS = credentials('docker-registry-credentials')
}
```

### 2. Tag Images Properly
✅ **Always include**:
- Build number
- Git commit hash
- Environment tag

```groovy
IMAGE_TAG = "${BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
```

### 3. Run Tests in Parallel
✅ **Speed up builds** by running independent stages in parallel:
```groovy
parallel {
    stage('Unit Tests') { ... }
    stage('Integration Tests') { ... }
}
```

### 4. Implement Health Checks
✅ **Always verify** deployment before marking success:
```bash
curl -f http://localhost:3000/health || exit 1
```

### 5. Clean Up Resources
✅ **Prevent disk space issues**:
```groovy
post {
    cleanup {
        sh 'docker image prune -f --filter "until=24h"'
    }
}
```

### 6. Use Build Stages Wisely
✅ **Fail fast**: Put quick checks (lint, security) before slow builds
```
Checkout → Install → Lint/Security → Build → Test → Deploy
```

### 7. Implement Rollback Strategy
✅ **Production deployments** should support rollback:
```bash
# Tag current image as backup before deploying
docker tag current-image backup-$(date +%Y%m%d)
```

### 8. Monitor Pipeline Performance
✅ **Track metrics**:
- Build duration
- Success/failure rate
- Deployment frequency
- Time to recovery

## Advanced Configuration

### Multi-Branch Pipeline

For automatic pipeline creation per branch:

1. Create "Multibranch Pipeline" job
2. Configure branch sources (GitHub/GitLab)
3. Jenkinsfile will be auto-discovered in each branch

### Parameterized Builds

Add parameters for manual deployments:

```groovy
parameters {
    choice(name: 'ENVIRONMENT', choices: ['staging', 'production'], description: 'Deployment environment')
    string(name: 'IMAGE_TAG', defaultValue: 'latest', description: 'Docker image tag')
}
```

### Notifications

#### Slack Integration
```groovy
post {
    success {
        slackSend color: 'good', message: "Build #${BUILD_NUMBER} succeeded"
    }
}
```

#### Email Notifications
```groovy
post {
    failure {
        emailext subject: "Build Failed: ${JOB_NAME} #${BUILD_NUMBER}",
                 body: "Check console output at ${BUILD_URL}",
                 to: "team@example.com"
    }
}
```

## Security Considerations

1. **Secrets Management**: Use Jenkins Credentials, never commit secrets
2. **Access Control**: Implement role-based access control (RBAC)
3. **Audit Logs**: Enable and monitor Jenkins audit logs
4. **Container Scanning**: Integrate Trivy or similar for image scanning
5. **Network Security**: Use HTTPS for Jenkins, restrict network access

## Performance Optimization

1. **Caching**: Use Docker layer caching for faster builds
2. **Parallel Execution**: Run independent stages in parallel
3. **Resource Limits**: Set appropriate CPU/memory limits
4. **Build Agents**: Use multiple agents for concurrent builds
5. **Artifact Cleanup**: Regularly clean old artifacts and images

## Support and Resources

- **Jenkins Documentation**: https://www.jenkins.io/doc/
- **Docker Pipeline Plugin**: https://plugins.jenkins.io/docker-workflow/
- **Blue Ocean**: https://www.jenkins.io/projects/blueocean/
- **Pipeline Syntax**: https://www.jenkins.io/doc/book/pipeline/syntax/

---

**Need Help?** Check the [Troubleshooting](#troubleshooting) section or review Jenkins console output for detailed error messages.
