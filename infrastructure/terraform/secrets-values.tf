# Auto-generated app secrets + secret payloads injected into the ECS task.
# Values live only in Secrets Manager (+ encrypted terraform state), never in the repo.

# JWT signing secrets + field-encryption keys (32-byte base64) — generated once by terraform.
resource "random_password" "jwt" {
  length  = 48
  special = false
}

resource "random_password" "jwt_refresh" {
  length  = 48
  special = false
}

resource "random_id" "aes_key" {
  byte_length = 32
}

resource "random_id" "blind_index_key" {
  byte_length = 32
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    JWT_SECRET         = random_password.jwt.result
    JWT_REFRESH_SECRET = random_password.jwt_refresh.result
    AES_ENCRYPTION_KEY = random_id.aes_key.b64_std
    BLIND_INDEX_KEY    = random_id.blind_index_key.b64_std
  })
}

# Full Prisma connection string (host known after apply, password from the sensitive var).
resource "aws_secretsmanager_secret_version" "db_url" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/rdn?schema=public"
  })
}

# Third-party keys (MSG91, Exotel, Razorpay). Seeded with EMPTY placeholders so the ECS
# secret wiring is valid; POPULATE the real values in the Secrets Manager console after
# apply. ignore_changes stops a later `terraform apply` from wiping what you entered.
# NOTE: MSG91_AUTH_KEY/TEMPLATE_ID and the AES keys are prod boot-required — the API will
# crash-loop until you fill the MSG91 (and Exotel, for calling) values here.
resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    MSG91_AUTH_KEY      = ""
    MSG91_TEMPLATE_ID   = ""
    MSG91_SENDER_ID     = ""
    EXOTEL_API_KEY      = ""
    EXOTEL_API_TOKEN    = ""
    EXOTEL_SID          = ""
    EXOTEL_CALLER_ID    = ""
    EXOTEL_SUBDOMAIN    = ""
    RAZORPAY_KEY_ID     = ""
    RAZORPAY_KEY_SECRET = ""
  })
  lifecycle {
    ignore_changes = [secret_string]
  }
}
