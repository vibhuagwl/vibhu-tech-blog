output "alb_dns_name" {
  description = "Hit http://<this>/api/users/101"
  value       = aws_lb.public.dns_name
}

output "alb_url" {
  value = "http://${aws_lb.public.dns_name}"
}

output "cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "user_service_dns" {
  value = "user-service.${var.cloud_map_namespace}"
}

output "order_service_dns" {
  value = "order-service.${var.cloud_map_namespace}"
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

output "autoscaling" {
  description = "ECS autoscaling bounds (when enable_autoscaling=true)"
  value = var.enable_autoscaling ? {
    min_capacity           = var.autoscaling_min_capacity
    max_capacity           = var.autoscaling_max_capacity
    cpu_target_percent     = var.autoscaling_cpu_target
    alb_requests_per_target = var.autoscaling_requests_per_target
    services               = ["api-gateway", "user-service", "order-service"]
  } : null
}
