# ECS Service Auto Scaling (Application Auto Scaling)
# Scales Fargate task count; ALB continues to register/deregister gateway IPs.

variable "enable_autoscaling" {
  type        = bool
  description = "Attach Application Auto Scaling to ECS services"
  default     = true
}

variable "autoscaling_min_capacity" {
  type        = number
  description = "Minimum tasks per service when autoscaling is on"
  default     = 2
}

variable "autoscaling_max_capacity" {
  type        = number
  description = "Maximum tasks per service when autoscaling is on"
  default     = 6
}

variable "autoscaling_cpu_target" {
  type        = number
  description = "Target average CPU utilization (%) for TargetTracking"
  default     = 60
}

variable "autoscaling_requests_per_target" {
  type        = number
  description = "ALB RequestCountPerTarget target for api-gateway only"
  default     = 1000
}

locals {
  ecs_services = var.enable_autoscaling ? {
    gateway = {
      service_name = aws_ecs_service.gateway.name
      resource_id  = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.gateway.name}"
    }
    user = {
      service_name = aws_ecs_service.user.name
      resource_id  = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.user.name}"
    }
    order = {
      service_name = aws_ecs_service.order.name
      resource_id  = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.order.name}"
    }
    payment = {
      service_name = aws_ecs_service.payment.name
      resource_id  = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.payment.name}"
    }
  } : {}
}

resource "aws_appautoscaling_target" "ecs" {
  for_each = local.ecs_services

  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = each.value.resource_id
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Scale on CPU for every service (works without ALB metrics for user/order)
resource "aws_appautoscaling_policy" "cpu" {
  for_each = local.ecs_services

  name               = "${var.name_prefix}-${each.key}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_cpu_target
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

# Edge-only: scale api-gateway on ALB requests per target
resource "aws_appautoscaling_policy" "gateway_alb_requests" {
  count = var.enable_autoscaling ? 1 : 0

  name               = "${var.name_prefix}-gateway-alb-requests"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs["gateway"].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs["gateway"].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs["gateway"].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.public.arn_suffix}/${aws_lb_target_group.gateway.arn_suffix}"
    }
    target_value       = var.autoscaling_requests_per_target
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}
