# payment-service — fail-closed money path behind internal ALB /payments*

locals {
  ecr_payment_service = "${aws_ecr_repository.payment_service.repository_url}:${var.image_tag}"
  payment_service_uri = "http://${aws_lb.internal.dns_name}"
}

resource "aws_ecr_repository" "payment_service" {
  name                 = "gateway-lab/payment-service"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "payment_keep_last_10" {
  repository = aws_ecr_repository.payment_service.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_lb_target_group" "payment" {
  name        = "${var.name_prefix}-pay"
  port        = 8084
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  deregistration_delay = 30

  health_check {
    path                = "/actuator/health"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener_rule" "payments" {
  listener_arn = aws_lb_listener.internal_http.arn
  priority     = 30

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.payment.arn
  }

  condition {
    path_pattern {
      values = ["/payments", "/payments/*"]
    }
  }
}

resource "aws_security_group_rule" "payment_from_internal_alb" {
  type                     = "ingress"
  from_port                = 8084
  to_port                  = 8084
  protocol                 = "tcp"
  security_group_id        = aws_security_group.services.id
  source_security_group_id = aws_security_group.internal_alb.id
  description              = "Internal ALB to payment"
}

resource "aws_ecs_task_definition" "payment" {
  family                   = "gateway-lab-payment"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name      = "payment-service"
    image     = local.ecr_payment_service
    essential = true
    portMappings = [{
      containerPort = 8084
      protocol      = "tcp"
    }]
    environment = [
      { name = "SPRING_PROFILES_ACTIVE", value = "aws" },
      { name = "SERVER_PORT", value = "8084" },
      { name = "INSTANCE_ID", value = "payment-ecs" }
    ]
    healthCheck = {
      command     = ["CMD-SHELL", "curl -fsS http://localhost:8084/actuator/health || exit 1"]
      interval    = 15
      timeout     = 5
      retries     = 3
      startPeriod = 40
    }
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.ecs.name
        awslogs-region        = local.region
        awslogs-stream-prefix = "payment"
      }
    }
  }])
}

resource "aws_ecs_service" "payment" {
  name                              = "payment-service"
  cluster                           = aws_ecs_cluster.this.id
  task_definition                   = aws_ecs_task_definition.payment.arn
  desired_count                     = var.desired_count
  launch_type                       = "FARGATE"
  health_check_grace_period_seconds = 60

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = local.task_subnet_ids
    security_groups  = [aws_security_group.services.id]
    assign_public_ip = local.task_assign_public_ip
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.payment.arn
    container_name   = "payment-service"
    container_port   = 8084
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  depends_on = [aws_lb_listener_rule.payments]
}
