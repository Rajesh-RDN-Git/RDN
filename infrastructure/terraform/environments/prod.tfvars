environment       = "prod"
db_instance_class = "db.t3.medium"
redis_node_type   = "cache.t3.small"
ecs_cpu           = 512
ecs_memory        = 1024
ecs_desired_count = 2

# Domain + TLS. API served at api.rdnetwork.in; web at www/apex.
domain_name          = "rdnetwork.in"
cors_allowed_origins = ["https://www.rdnetwork.in", "https://rdnetwork.in"]

# Email for CloudWatch alarm notifications (confirm the SNS subscription AWS emails you).
alert_email = "rajesh@rdngroups.com"

# NOTE: db_password is a required sensitive var — NEVER put it here (this file may be
# committed). Pass it at apply time via env: export TF_VAR_db_password='...'
# Same for the Amplify GitHub token: export TF_VAR_github_access_token='ghp_...'
