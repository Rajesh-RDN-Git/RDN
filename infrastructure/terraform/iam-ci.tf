# Least-privilege IAM user for GitHub Actions (deploy-prod.yml): push image to ECR
# + trigger ECS rolling deploy. Access key goes into GitHub repo secrets.

resource "aws_iam_user" "ci_deploy" {
  name = "${var.app_name}-${var.environment}-ci-deploy"
  tags = { Name = "${var.app_name}-${var.environment}-ci-deploy" }
}

resource "aws_iam_user_policy" "ci_deploy" {
  name = "${var.app_name}-${var.environment}-ci-deploy"
  user = aws_iam_user.ci_deploy.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "EcrAuth"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Sid    = "EcrPush"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
        ]
        Resource = aws_ecr_repository.api.arn
      },
      {
        Sid    = "EcsDeploy"
        Effect = "Allow"
        Action = ["ecs:UpdateService", "ecs:DescribeServices"]
        Resource = [
          aws_ecs_service.api.id,
          aws_ecs_cluster.main.arn,
        ]
      },
    ]
  })
}

resource "aws_iam_access_key" "ci_deploy" {
  user = aws_iam_user.ci_deploy.name
}

output "ci_deploy_access_key_id" {
  value = aws_iam_access_key.ci_deploy.id
}

output "ci_deploy_secret_access_key" {
  value     = aws_iam_access_key.ci_deploy.secret
  sensitive = true
}
