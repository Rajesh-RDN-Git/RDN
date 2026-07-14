# SNS topic for CloudWatch alarms. Set alert_email (var) to get notified; you must
# click the confirmation link AWS emails before notifications start flowing.

variable "alert_email" {
  type        = string
  default     = ""
  description = "Email address to receive CloudWatch alarm notifications."
}

resource "aws_sns_topic" "alerts" {
  name = "${var.app_name}-${var.environment}-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
