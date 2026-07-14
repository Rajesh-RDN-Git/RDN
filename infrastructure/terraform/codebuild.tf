# One-command API image build+deploy in AWS (fallback while GitHub Actions is
# unavailable): aws codebuild start-build --project-name rdn-prod-api-build

resource "aws_iam_role" "codebuild" {
  name = "${var.app_name}-${var.environment}-codebuild"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "codebuild.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "codebuild" {
  name = "${var.app_name}-${var.environment}-codebuild"
  role = aws_iam_role.codebuild.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
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
        Effect   = "Allow"
        Action   = ["ecs:UpdateService", "ecs:DescribeServices"]
        Resource = [aws_ecs_service.api.id, aws_ecs_cluster.main.arn]
      },
    ]
  })
}

resource "aws_codebuild_source_credential" "github" {
  count       = var.github_access_token != "" ? 1 : 0
  auth_type   = "PERSONAL_ACCESS_TOKEN"
  server_type = "GITHUB"
  token       = var.github_access_token
}

resource "aws_codebuild_project" "api_build" {
  count        = var.github_access_token != "" ? 1 : 0
  name         = "${var.app_name}-${var.environment}-api-build"
  service_role = aws_iam_role.codebuild.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_MEDIUM"
    image           = "aws/codebuild/standard:7.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    environment_variable {
      name  = "ECR_URI"
      value = aws_ecr_repository.api.repository_url
    }
    environment_variable {
      name  = "ECS_CLUSTER"
      value = aws_ecs_cluster.main.name
    }
    environment_variable {
      name  = "ECS_SERVICE"
      value = aws_ecs_service.api.name
    }
    environment_variable {
      name  = "AWS_REGION_NAME"
      value = var.aws_region
    }
  }

  source {
    type            = "GITHUB"
    location        = "https://github.com/Rajesh-RDN-Git/RDN.git"
    git_clone_depth = 1
    buildspec       = <<-YAML
      version: 0.2
      phases:
        pre_build:
          commands:
            - aws ecr get-login-password --region $AWS_REGION_NAME | docker login --username AWS --password-stdin $ECR_URI
        build:
          commands:
            - docker build -f infrastructure/docker/Dockerfile.api -t $ECR_URI:prod-latest -t $ECR_URI:prod-$CODEBUILD_RESOLVED_SOURCE_VERSION .
            - docker push $ECR_URI --all-tags
        post_build:
          commands:
            - aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $AWS_REGION_NAME
      YAML
  }

  source_version = "main"

  depends_on = [aws_codebuild_source_credential.github]
}
