resource "aws_secretsmanager_secret" "db_credentials" {
  name = "${var.app_name}/${var.environment}/db-credentials"
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "${var.app_name}/${var.environment}/jwt-secret"
}

resource "aws_secretsmanager_secret" "api_keys" {
  name        = "${var.app_name}/${var.environment}/api-keys"
  description = "Third-party API keys (MSG91, Exotel, Razorpay, FCM)"
}
