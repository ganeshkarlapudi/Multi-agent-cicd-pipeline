# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_ca_certificate" {
  description = "EKS cluster CA certificate (base64)"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "deploy_agent_role_arn" {
  description = "ARN of the deploy-agent IAM role (set as DEPLOY_ROLE_ARN in GitLab CI/CD)"
  value       = aws_iam_role.deploy_agent.arn
}

output "monitor_agent_role_arn" {
  description = "ARN of the monitor-agent IAM role"
  value       = aws_iam_role.monitor_agent.arn
}

output "ecr_repository_url" {
  description = "ECR repository URL for AgentOps images"
  value       = aws_ecr_repository.ai_hub.repository_url
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (host:port)"
  value       = aws_db_instance.main.endpoint
}

output "rds_hostname" {
  description = "RDS PostgreSQL hostname"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.main.port
}

output "rds_db_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}
