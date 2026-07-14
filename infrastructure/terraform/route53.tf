# Route53 hosted zone for the domain + automated ACM DNS validation + api alias.
# After apply, point the domain's nameservers (at your registrar) to this zone's NS
# records (terraform output route53_nameservers) so the cert validates and DNS resolves.

resource "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
  tags  = { Name = "${var.app_name}-${var.environment}-zone" }
}

# DNS records that prove domain ownership for the ACM cert.
resource "aws_route53_record" "acm_validation" {
  for_each = var.domain_name != "" ? {
    for dvo in aws_acm_certificate.api[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  } : {}

  zone_id         = aws_route53_zone.main[0].zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

# Waits until the cert is validated via the records above.
resource "aws_acm_certificate_validation" "api" {
  count                   = var.domain_name != "" ? 1 : 0
  certificate_arn         = aws_acm_certificate.api[0].arn
  validation_record_fqdns = [for r in aws_route53_record.acm_validation : r.fqdn]
}

# api.rdnetwork.in -> the ALB.
resource "aws_route53_record" "api" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.api.dns_name
    zone_id                = aws_lb.api.zone_id
    evaluate_target_health = true
  }
}

# Preserve the domain's existing GoDaddy email (MX + SPF) across the NS switch.
resource "aws_route53_record" "mx" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = 3600
  records = ["0 smtp.secureserver.net.", "10 mailstore1.secureserver.net."]
}

resource "aws_route53_record" "spf" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 3600
  records = ["v=spf1 include:secureserver.net -all"]
}

output "route53_nameservers" {
  description = "Point your registrar's nameservers to these to activate the domain + TLS."
  value       = var.domain_name != "" ? aws_route53_zone.main[0].name_servers : []
}
