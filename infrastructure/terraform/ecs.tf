resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-${var.environment}"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.app_name}-${var.environment}-ecs-exec"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow the execution role to pull the container's secrets from Secrets Manager.
resource "aws_iam_role_policy" "ecs_exec_secrets" {
  name = "secrets-access"
  role = aws_iam_role.ecs_task_execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["secretsmanager:GetSecretValue"]
      Resource = [
        aws_secretsmanager_secret.db_credentials.arn,
        aws_secretsmanager_secret.jwt_secret.arn,
        aws_secretsmanager_secret.api_keys.arn,
      ]
    }]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "${var.app_name}-${var.environment}-ecs-task"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "s3-access"
  role = aws_iam_role.ecs_task.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"], Resource = "${aws_s3_bucket.media.arn}/*" }]
  })
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.app_name}-${var.environment}"
  retention_in_days = 30
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.app_name}-${var.environment}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name         = "api"
    image        = "${aws_ecr_repository.api.repository_url}:latest"
    portMappings = [{ containerPort = 4000, protocol = "tcp" }]
    logConfiguration = {
      logDriver = "awslogs"
      options   = { "awslogs-group" = aws_cloudwatch_log_group.api.name, "awslogs-region" = var.aws_region, "awslogs-stream-prefix" = "api" }
    }
    environment = [
      # Node convention expects exactly "production" — the app's prod guards
      # (swagger-off, MSG91/JWT fail-fast) all check that literal.
      { name = "NODE_ENV", value = var.environment == "prod" ? "production" : var.environment },
      { name = "PORT", value = "4000" },
      { name = "AWS_REGION", value = var.aws_region },
      { name = "AWS_S3_BUCKET", value = aws_s3_bucket.media.id },
      { name = "AWS_CLOUDFRONT_URL", value = "https://${aws_cloudfront_distribution.media.domain_name}" },
      { name = "ALLOWED_ORIGINS", value = join(",", var.cors_allowed_origins) },
      { name = "REDIS_URL", value = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:6379" },
    ]
    secrets = [
      { name = "DATABASE_URL", valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:DATABASE_URL::" },
      { name = "JWT_SECRET", valueFrom = "${aws_secretsmanager_secret.jwt_secret.arn}:JWT_SECRET::" },
      { name = "JWT_REFRESH_SECRET", valueFrom = "${aws_secretsmanager_secret.jwt_secret.arn}:JWT_REFRESH_SECRET::" },
      { name = "AES_ENCRYPTION_KEY", valueFrom = "${aws_secretsmanager_secret.jwt_secret.arn}:AES_ENCRYPTION_KEY::" },
      { name = "BLIND_INDEX_KEY", valueFrom = "${aws_secretsmanager_secret.jwt_secret.arn}:BLIND_INDEX_KEY::" },
      { name = "MSG91_AUTH_KEY", valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:MSG91_AUTH_KEY::" },
      { name = "MSG91_TEMPLATE_ID", valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:MSG91_TEMPLATE_ID::" },
      { name = "MSG91_SENDER_ID", valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:MSG91_SENDER_ID::" },
      { name = "EXOTEL_API_KEY", valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:EXOTEL_API_KEY::" },
      { name = "EXOTEL_API_TOKEN", valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:EXOTEL_API_TOKEN::" },
      { name = "EXOTEL_SID", valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:EXOTEL_SID::" },
      { name = "EXOTEL_CALLER_ID", valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:EXOTEL_CALLER_ID::" },
      { name = "EXOTEL_SUBDOMAIN", valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:EXOTEL_SUBDOMAIN::" },
      { name = "RAZORPAY_KEY_ID", valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:RAZORPAY_KEY_ID::" },
      { name = "RAZORPAY_KEY_SECRET", valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:RAZORPAY_KEY_SECRET::" },
    ]
    healthCheck = { command = ["CMD-SHELL", "curl -f http://localhost:4000/v1/health || exit 1"], interval = 30, timeout = 5, retries = 3, startPeriod = 180 }
  }])
}

resource "aws_ecs_service" "api" {
  name            = "${var.app_name}-${var.environment}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 4000
  }

  depends_on = [
    aws_lb_listener.https,
    aws_iam_role_policy.ecs_exec_secrets,
    aws_secretsmanager_secret_version.app_secrets,
    aws_secretsmanager_secret_version.db_url,
    aws_secretsmanager_secret_version.api_keys,
  ]
}
