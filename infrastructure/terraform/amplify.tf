# AWS Amplify Hosting for the Next.js (App Router, SSR) web app — the All-AWS
# replacement for Vercel. Amplify connects to the GitHub repo and auto-builds on
# every push to main. Monorepo: the app lives in apps/web.
#
# Requires a GitHub token with repo access, passed at apply time (never committed):
#   export TF_VAR_github_access_token='ghp_...'

variable "github_repository" {
  type    = string
  default = "https://github.com/Rajesh-RDN-Git/RDN"
}

variable "github_access_token" {
  type      = string
  sensitive = true
  default   = ""
}

# Amplify is provisioned only once a GitHub token is supplied (it's required to
# connect the repo). Leave the token unset to plan/apply the rest of the stack first.
locals {
  # whether a token is present is not itself secret — unwrap so outputs don't taint
  enable_amplify = var.domain_name != "" && nonsensitive(var.github_access_token != "")
}

resource "aws_amplify_app" "web" {
  count        = local.enable_amplify ? 1 : 0
  name         = "${var.app_name}-${var.environment}-web"
  repository   = var.github_repository
  access_token = var.github_access_token
  platform     = "WEB_COMPUTE" # Next.js SSR (server compute), not static

  environment_variables = {
    NEXT_PUBLIC_API_URL       = "https://api.${var.domain_name}/v1"
    AMPLIFY_MONOREPO_APP_ROOT = "apps/web"
    AMPLIFY_DIFF_DEPLOY       = "false"
  }

  build_spec = <<-YAML
    version: 1
    applications:
      - appRoot: apps/web
        frontend:
          buildPath: '/'
          phases:
            preBuild:
              commands:
                - corepack enable && corepack prepare pnpm@9.15.4 --activate
                # Hoisted linker only in this container (Amplify can't bundle pnpm
                # symlinks); web subtree only so mobile's React 19 stays out.
                - echo "node-linker=hoisted" > .npmrc
                - pnpm install --frozen-lockfile --filter web...
            build:
              commands:
                - pnpm --filter @rdn/shared build
                - pnpm --filter web build
          artifacts:
            baseDirectory: apps/web/.next
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
              - apps/web/.next/cache/**/*
  YAML

  lifecycle {
    ignore_changes = [access_token] # avoid perpetual diff once set out-of-band
  }
}

resource "aws_amplify_branch" "main" {
  count             = local.enable_amplify ? 1 : 0
  app_id            = aws_amplify_app.web[0].id
  branch_name       = "main"
  framework         = "Next.js - SSR"
  stage             = "PRODUCTION"
  enable_auto_build = true
}

# www.rdnetwork.in + apex rdnetwork.in -> Amplify. Amplify writes the DNS records
# into the Route53 zone automatically (same account).
resource "aws_amplify_domain_association" "web" {
  count                 = local.enable_amplify ? 1 : 0
  app_id                = aws_amplify_app.web[0].id
  domain_name           = var.domain_name
  wait_for_verification = false

  sub_domain {
    branch_name = aws_amplify_branch.main[0].branch_name
    prefix      = "www"
  }
  sub_domain {
    branch_name = aws_amplify_branch.main[0].branch_name
    prefix      = "" # apex
  }

  depends_on = [aws_route53_zone.main]
}

output "amplify_app_id" {
  value = local.enable_amplify ? aws_amplify_app.web[0].id : ""
}

output "amplify_default_domain" {
  description = "Amplify's default URL (before custom domain verifies)."
  value       = local.enable_amplify ? aws_amplify_app.web[0].default_domain : ""
}
