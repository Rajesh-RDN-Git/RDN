variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "app_name" {
  type    = string
  default = "rdn"
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "redis_node_type" {
  type    = string
  default = "cache.t3.micro"
}

variable "ecs_cpu" {
  type    = number
  default = 256
}

variable "ecs_memory" {
  type    = number
  default = 512
}

variable "ecs_desired_count" {
  type    = number
  default = 1
}

variable "domain_name" {
  type    = string
  default = ""
}

variable "cors_allowed_origins" {
  type        = list(string)
  description = "Allowed origins for S3 media bucket CORS (set to prod web URL in prod)."
  default     = ["*"]
}

variable "db_username" {
  type      = string
  default   = "rdn_admin"
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}
