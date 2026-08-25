# ---------------------------------------------------------------------------
# ECR Repository for AgentOps Docker images
# ---------------------------------------------------------------------------

resource "aws_ecr_repository" "ai_hub" {
  name                 = "AgentOps"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "AgentOps"
  }
}

# Lifecycle policy: keep last 10 tagged images, expire untagged after 7 days
resource "aws_ecr_lifecycle_policy" "ai_hub" {
  repository = aws_ecr_repository.ai_hub.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Keep last 20 tagged images"
        selection = {
          tagStatus   = "tagged"
          tagPrefixList = ["latest"]
          countType   = "imageCountMoreThan"
          countNumber = 20
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
