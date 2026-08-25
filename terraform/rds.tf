# ---------------------------------------------------------------------------
# RDS PostgreSQL for AgentOps (replaces SQLite)
# ---------------------------------------------------------------------------

resource "aws_db_subnet_group" "main" {
  name       = "AgentOps-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "AgentOps-db-subnet-group"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "AgentOps-rds-"
  vpc_id      = aws_vpc.main.id

  # Allow PostgreSQL access from EKS nodes only
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
    description     = "PostgreSQL from EKS cluster"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "AgentOps-rds-sg"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "AgentOps-db"
  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.rds_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.rds_db_name
  username = var.rds_username
  password = var.rds_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az            = false   # Set true for production HA
  publicly_accessible = false
  skip_final_snapshot = true    # Set false for production

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Performance Insights (free tier for 7 days)
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = {
    Name = "AgentOps-db"
  }
}
