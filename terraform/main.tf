terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ---------------------------------------------------------------------------
# GitLab OIDC provider -- lets GitLab CI/CD jobs assume AWS roles without
# long-lived access keys.
# ---------------------------------------------------------------------------
resource "aws_iam_openid_connect_provider" "gitlab" {
  url             = "https://gitlab.com"
  client_id_list  = ["https://gitlab.com"]
  thumbprint_list = ["8ecde6884f3d87b1125ba31ac3fcb13d7016de7f"] # GitLab.com root CA thumbprint
}

# ---------------------------------------------------------------------------
# Deploy Agent role -- terraform apply + kubectl apply only.
# Trust is scoped to the "main" branch of this project, nothing else.
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "deploy_agent_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.gitlab.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "gitlab.com:aud"
      values   = ["https://gitlab.com"]
    }

    condition {
      test     = "StringLike"
      variable = "gitlab.com:sub"
      values   = ["project_path:${var.gitlab_project_path}:ref_type:branch:ref:main"]
    }
  }
}

resource "aws_iam_role" "deploy_agent" {
  name               = "deploy-agent-role"
  assume_role_policy = data.aws_iam_policy_document.deploy_agent_trust.json
}

data "aws_iam_policy_document" "deploy_agent_permissions" {
  statement {
    sid    = "EKSAccess"
    effect = "Allow"
    actions = [
      "eks:DescribeCluster",
      "eks:ListClusters",
    ]
    resources = [aws_eks_cluster.main.arn]
  }

  statement {
    sid    = "TerraformStateAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
    ]
    resources = [
      "arn:aws:s3:::${var.tf_state_bucket}/*",
      "arn:aws:dynamodb:${var.aws_region}:${var.account_id}:table/${var.tf_lock_table}",
    ]
  }

  statement {
    sid    = "ECRPushAccess"
    effect = "Allow"
    actions = [
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
    ]
    resources = [aws_ecr_repository.ai_hub.arn]
  }

  statement {
    sid       = "ECRAuthToken"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "deploy_agent" {
  name   = "deploy-agent-policy"
  role   = aws_iam_role.deploy_agent.id
  policy = data.aws_iam_policy_document.deploy_agent_permissions.json
}

# ---------------------------------------------------------------------------
# Monitor & Rollback Agent role -- CloudWatch read + rollback only.
# Deliberately excludes terraform:Apply and any IAM permissions, so it can
# never both deploy and approve/undo a deploy.
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "monitor_agent_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.gitlab.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "gitlab.com:aud"
      values   = ["https://gitlab.com"]
    }

    condition {
      test     = "StringLike"
      variable = "gitlab.com:sub"
      values   = ["project_path:${var.gitlab_project_path}:ref_type:branch:ref:main"]
    }
  }
}

resource "aws_iam_role" "monitor_agent" {
  name               = "monitor-agent-role"
  assume_role_policy = data.aws_iam_policy_document.monitor_agent_trust.json
}

data "aws_iam_policy_document" "monitor_agent_permissions" {
  statement {
    sid    = "CloudWatchRead"
    effect = "Allow"
    actions = [
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:GetMetricData",
      "cloudwatch:ListMetrics",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "EKSDescribeOnly"
    effect    = "Allow"
    actions   = ["eks:DescribeCluster"]
    resources = [aws_eks_cluster.main.arn]
  }
}

resource "aws_iam_role_policy" "monitor_agent" {
  name   = "monitor-agent-policy"
  role   = aws_iam_role.monitor_agent.id
  policy = data.aws_iam_policy_document.monitor_agent_permissions.json
}

# ---------------------------------------------------------------------------
# CloudWatch alarm mirrors the threshold the Monitor Agent polls for, so you
# get a push alert as a backstop to the agent's own poll loop.
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "high_5xx" {
  alarm_name          = "app-high-5xx-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "Triggers when 5xx errors exceed threshold post-deploy"
  treat_missing_data  = "notBreaching"
}
