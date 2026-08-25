variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-2"
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name the agents deploy to and monitor"
  type        = string
  default     = "AgentOps-cluster"
}

variable "gitlab_project_path" {
  description = "GitLab project path, e.g. your-group/your-project"
  type        = string
}

variable "tf_state_bucket" {
  description = "S3 bucket used for Terraform remote state"
  type        = string
}

variable "tf_lock_table" {
  description = "DynamoDB table used for Terraform state locking"
  type        = string
}

# ---------------------------------------------------------------------------
# VPC
# ---------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ---------------------------------------------------------------------------
# EKS
# ---------------------------------------------------------------------------

variable "eks_node_instance_types" {
  description = "EC2 instance types for EKS worker nodes"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "eks_node_desired_size" {
  description = "Desired number of EKS worker nodes"
  type        = number
  default     = 2
}

variable "eks_node_min_size" {
  description = "Minimum number of EKS worker nodes"
  type        = number
  default     = 1
}

variable "eks_node_max_size" {
  description = "Maximum number of EKS worker nodes"
  type        = number
  default     = 4
}

# ---------------------------------------------------------------------------
# RDS (PostgreSQL)
# ---------------------------------------------------------------------------

variable "rds_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "aihub"
}

variable "rds_username" {
  description = "Master username for the RDS instance"
  type        = string
  default     = "aihubadmin"
}

variable "rds_password" {
  description = "Master password for the RDS instance"
  type        = string
  sensitive   = true
}
