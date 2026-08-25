# Multi-Agent AI CI/CD Pipeline for AgentOps

Three GitLab CI jobs, each acting as an independent agent with its own
scoped credentials, deploying the [AgentOps](https://github.com/ganeshkarlapudi/AgentOps)
Node.js application to AWS EKS with automated code review, deployment,
and post-deploy monitoring.

```
MR opened/updated
      |
      v
+------------------+   posts review notes
|  PR Review Agent |----------------------------> GitLab MR
+------------------+
      | (pipeline passes + human approves)
      v
+------------------+   docker build & push
|   Build Stage    |----------------------------> AWS ECR
+------------------+
      |
      v
+------------------+   terraform apply / kubectl apply
|   Deploy Agent   |----------------------------> AWS EKS (ap-south-2)
+------------------+
      |
      v
+------------------------+  watches metrics, rolls back on breach
| Monitor & Rollback     |----------------------------> kubectl / CloudWatch
| Agent                  |
+------------------------+
```

## Repo layout

```
.gitlab-ci.yml          # 4-stage pipeline: review -> build -> deploy -> monitor
agents/
  pr_review_agent.py     # Gemini review, posts GitLab MR notes
  deploy_agent.py         # OIDC-assumed role, terraform + kubectl apply
  monitor_agent.py        # CloudWatch polling + kubectl rollout undo
terraform/
  main.tf                 # GitLab OIDC provider, two scoped IAM roles, alarm
  variables.tf            # All configurable variables
  vpc.tf                  # VPC, subnets, NAT gateway, IGW
  eks.tf                  # EKS cluster + managed node group
  rds.tf                  # RDS PostgreSQL instance
  ecr.tf                  # ECR Docker image repository
  outputs.tf              # Export ARNs, endpoints, URLs
k8s/
  deployment.yaml         # AgentOps deployment with RDS env vars
  service.yaml            # LoadBalancer service (port 80 -> 3000)
  secrets.yaml            # Template for RDS and app secrets
requirements.txt
.gitignore
```

## Architecture

| Component | Technology | Region |
|---|---|---|
| Application | Node.js 18 + Express (AgentOps) | - |
| CI/CD | GitLab CI (4 stages) | - |
| AI Code Review | Google Gemini (`gemini-2.5-flash`) | - |
| Container Registry | AWS ECR | ap-south-2 |
| Kubernetes | AWS EKS (v1.30) | ap-south-2 |
| Database | Amazon RDS PostgreSQL 16 | ap-south-2 |
| Monitoring | AWS CloudWatch + Prometheus + Grafana | ap-south-2 |
| Auth (CI/CD) | GitLab OIDC -> AWS STS (no stored keys) | - |

## Guardrails

| Guardrail | How it's enforced |
|---|---|
| No merge without AI review + tests passing | GitLab "Pipelines must succeed" merge check |
| Human approval before prod deploy | Protected Environment `production` with required approvers |
| Per-agent credential scoping | `deploy-agent-role` and `monitor-agent-role` are separate IAM roles with disjoint policies |
| No long-lived cloud secrets | GitLab OIDC (`id_tokens`) exchanged for short-lived AWS STS credentials per job |
| PR Review Agent can't deploy | Its only credential is a GitLab project access token scoped to `api` (MR notes) -- no AWS access at all |
| Monitor Agent can't redeploy or touch IAM | Its IAM policy allows CloudWatch reads + `eks:DescribeCluster` only |
| Audit trail | Monitor Agent prints structured JSON for every decision (rollback or not), captured in job logs |
| Database security | RDS in private subnets, accessible only from EKS security group |

## Setup checklist

### Prerequisites
- AWS CLI configured with admin-level credentials (for initial Terraform bootstrap)
- Docker (for local testing)
- Git

### 1. Create GitLab project

```bash
# Clone AgentOps from GitHub
git clone https://github.com/ganeshkarlapudi/AgentOps.git AgentOps-cicd
cd AgentOps-cicd

# Copy CI/CD pipeline files
cp -r /path/to/multi-agent-cicd-pipeline/agents/ ./agents/
cp -r /path/to/multi-agent-cicd-pipeline/k8s/ ./k8s/
cp -r /path/to/multi-agent-cicd-pipeline/terraform/ ./terraform/
cp /path/to/multi-agent-cicd-pipeline/.gitlab-ci.yml ./
cp /path/to/multi-agent-cicd-pipeline/requirements.txt ./

# Push to GitLab
git remote add gitlab https://gitlab.com/your-group/AgentOps.git
git push gitlab main
```

### 2. GitLab CI/CD variables

Create these in **Settings → CI/CD → Variables**:

| Variable | Value | Flags |
|---|---|---|
| `GITLAB_BOT_TOKEN` | Project access token (scope: `api`) | Masked, Protected |
| `GEMINI_API_KEY` | API key from Google AI Studio | Masked, Protected |
| `DEPLOY_ROLE_ARN` | `deploy-agent-role` ARN (from Terraform output) | Protected |
| `MONITOR_ROLE_ARN` | `monitor-agent-role` ARN (from Terraform output) | Protected |
| `AWS_ACCOUNT_ID` | Your 12-digit AWS account ID | Protected |
| `EKS_CLUSTER_NAME` | `AgentOps-cluster` (or your custom name) | Protected |

### 3. Bootstrap AWS infrastructure

Create `terraform/terraform.tfvars`:

```hcl
account_id          = "123456789012"
cluster_name        = "AgentOps-cluster"
gitlab_project_path = "your-group/AgentOps"
tf_state_bucket     = "my-tf-state-bucket"
tf_lock_table       = "my-tf-lock-table"
rds_password        = "YourSecurePassword123!"
```

Apply from your local machine:

```bash
cd terraform
terraform init
terraform apply
```

### 4. Create K8s secrets

After Terraform completes, create the database and app secrets:

```bash
# Configure kubectl for the new cluster
aws eks update-kubeconfig --name AgentOps-cluster --region ap-south-2

# Create RDS credentials secret (use values from terraform output)
kubectl create secret generic AgentOps-db-credentials \
  --from-literal=host=$(terraform output -raw rds_hostname) \
  --from-literal=port=5432 \
  --from-literal=dbname=aihub \
  --from-literal=username=aihubadmin \
  --from-literal=password='YourSecurePassword123!'

# Create app secrets
kubectl create secret generic AgentOps-app-secrets \
  --from-literal=session-secret=$(openssl rand -hex 32)
```

### 5. Protect the environment

1. **Settings → CI/CD → Environments** → protect `production`, add required approvers
2. **Settings → Merge requests** → enable approval rules + "Pipelines must succeed"

### 6. Update AgentOps app for PostgreSQL

The AgentOps app needs to be updated to use PostgreSQL instead of SQLite.
Replace `sqlite3` with `pg` (node-postgres) in `server.js` and `package.json`.
The RDS connection details are injected as env vars: `DB_HOST`, `DB_PORT`,
`DB_NAME`, `DB_USER`, `DB_PASSWORD`.

## Testing the flow

1. Open an MR with an intentional bug → confirm the Review Agent comments.
2. Fix it, merge to `main` → confirm the Build stage creates a Docker image
   and pushes it to ECR.
3. Approve the environment deployment → confirm the Deploy job applies
   Terraform and the K8s manifests.
4. Deploy a broken image on purpose → confirm the Monitor Agent detects
   the 5xx spike and runs `kubectl rollout undo`.
5. Check the `monitor_rollback` job log for the JSON audit entry explaining
   why it rolled back (or didn't).

## Notes

- Swap `gemini-2.5-flash` for `gemini-2.5-pro` in `pr_review_agent.py` if
  you want stronger reasoning on complex diffs, at higher cost/latency.
- `ERROR_THRESHOLD` and `LOOKBACK_MINUTES` in `monitor_agent.py` are
  starting points -- tune them against your app's real baseline error rate.
- RDS is configured as single-AZ (`multi_az = false`) for cost savings.
  Set `multi_az = true` in `terraform/rds.tf` for production HA.
