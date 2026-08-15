output "alb_dns_name" {
  description = "Public ALB DNS — clients hit this (or HTTPS if ACM set)"
  value       = aws_lb.public.dns_name
}

output "alb_url" {
  value = local.enable_https ? "https://${aws_lb.public.dns_name}" : "http://${aws_lb.public.dns_name}"
}

output "internal_alb_dns" {
  description = "Internal ALB used by gateway for user/order (path /users*, /orders*)"
  value       = aws_lb.internal.dns_name
}

output "cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "ecr_api_gateway" {
  value = aws_ecr_repository.api_gateway.repository_url
}

output "ecr_user_service" {
  value = aws_ecr_repository.user_service.repository_url
}

output "ecr_order_service" {
  value = aws_ecr_repository.order_service.repository_url
}

output "aws_region" {
  value = local.region
}

output "production_mode" {
  value = {
    private_subnets = local.use_private_subnets
    https           = local.enable_https
    waf             = var.enable_waf
    task_public_ip  = local.task_assign_public_ip
  }
}

output "autoscaling" {
  description = "ECS autoscaling bounds (when enable_autoscaling=true)"
  value = var.enable_autoscaling ? {
    min_capacity            = var.autoscaling_min_capacity
    max_capacity            = var.autoscaling_max_capacity
    cpu_target_percent      = var.autoscaling_cpu_target
    alb_requests_per_target = var.autoscaling_requests_per_target
    services                = ["api-gateway", "user-service", "order-service"]
  } : null
}
