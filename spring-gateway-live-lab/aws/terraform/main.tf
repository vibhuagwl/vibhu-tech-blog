data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = var.aws_region

  ecr_api_gateway   = "${aws_ecr_repository.api_gateway.repository_url}:${var.image_tag}"
  ecr_user_service  = "${aws_ecr_repository.user_service.repository_url}:${var.image_tag}"
  ecr_order_service = "${aws_ecr_repository.order_service.repository_url}:${var.image_tag}"

  # Production discovery: one internal ALB path-routes /users* and /orders*
  user_service_uri  = "http://${aws_lb.internal.dns_name}"
  order_service_uri = "http://${aws_lb.internal.dns_name}"

  use_private_subnets   = length(var.private_subnet_ids) > 0
  task_subnet_ids       = local.use_private_subnets ? var.private_subnet_ids : var.public_subnet_ids
  task_assign_public_ip = local.use_private_subnets ? false : var.assign_public_ip
  internal_alb_subnets  = local.use_private_subnets ? var.private_subnet_ids : var.public_subnet_ids

  enable_https = var.acm_certificate_arn != ""
}

# --- ECR ---

resource "aws_ecr_repository" "api_gateway" {
  name                 = "gateway-lab/api-gateway"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "user_service" {
  name                 = "gateway-lab/user-service"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "order_service" {
  name                 = "gateway-lab/order-service"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "keep_last_10" {
  for_each = {
    api   = aws_ecr_repository.api_gateway.name
    user  = aws_ecr_repository.user_service.name
    order = aws_ecr_repository.order_service.name
  }

  repository = each.value
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

# --- ECS cluster + logs + IAM ---

resource "aws_ecs_cluster" "this" {
  name = var.name_prefix

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.name_prefix}"
  retention_in_days = 14
}

resource "aws_iam_role" "ecs_execution" {
  name = "${var.name_prefix}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# --- Security groups ---

resource "aws_security_group" "public_alb" {
  name        = "${var.name_prefix}-public-alb"
  description = "Internet-facing ALB to api-gateway"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.alb_ingress_cidrs
  }

  dynamic "ingress" {
    for_each = local.enable_https ? [443] : []
    content {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = var.alb_ingress_cidrs
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "internal_alb" {
  name        = "${var.name_prefix}-internal-alb"
  description = "Internal ALB to user/order (east-west)"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "services" {
  name        = "${var.name_prefix}-services"
  description = "ECS tasks (gateway + user + order)"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Cross-SG rules (avoid cyclic inline ingress references)
resource "aws_security_group_rule" "internal_alb_from_services" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  security_group_id        = aws_security_group.internal_alb.id
  source_security_group_id = aws_security_group.services.id
  description              = "Gateway tasks to internal ALB"
}

resource "aws_security_group_rule" "gateway_from_public_alb" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  security_group_id        = aws_security_group.services.id
  source_security_group_id = aws_security_group.public_alb.id
  description              = "Public ALB to gateway"
}

resource "aws_security_group_rule" "user_from_internal_alb" {
  type                     = "ingress"
  from_port                = 8081
  to_port                  = 8081
  protocol                 = "tcp"
  security_group_id        = aws_security_group.services.id
  source_security_group_id = aws_security_group.internal_alb.id
  description              = "Internal ALB to user"
}

resource "aws_security_group_rule" "order_from_internal_alb" {
  type                     = "ingress"
  from_port                = 8082
  to_port                  = 8082
  protocol                 = "tcp"
  security_group_id        = aws_security_group.services.id
  source_security_group_id = aws_security_group.internal_alb.id
  description              = "Internal ALB to order"
}

# --- Public ALB → api-gateway ---

resource "aws_lb" "public" {
  name               = "${var.name_prefix}-pub"
  load_balancer_type = "application"
  internal           = false
  security_groups    = [aws_security_group.public_alb.id]
  subnets            = var.public_subnet_ids

  enable_http2               = true
  enable_deletion_protection = false
  drop_invalid_header_fields = true
  idle_timeout               = 60
}

resource "aws_lb_target_group" "gateway" {
  name        = "${var.name_prefix}-gw"
  port        = 8080
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

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.public.arn
  port              = 80
  protocol          = "HTTP"

  dynamic "default_action" {
    for_each = local.enable_https ? [1] : []
    content {
      type = "redirect"
      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  dynamic "default_action" {
    for_each = local.enable_https ? [] : [1]
    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.gateway.arn
    }
  }
}

resource "aws_lb_listener" "https" {
  count = local.enable_https ? 1 : 0

  load_balancer_arn = aws_lb.public.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.gateway.arn
  }
}

# --- Internal ALB → user (/users*) + order (/orders*) ---

resource "aws_lb" "internal" {
  name               = "${var.name_prefix}-int"
  load_balancer_type = "application"
  internal           = true
  security_groups    = [aws_security_group.internal_alb.id]
  subnets            = local.internal_alb_subnets

  drop_invalid_header_fields = true
  idle_timeout               = 60
}

resource "aws_lb_target_group" "user" {
  name        = "${var.name_prefix}-user"
  port        = 8081
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

resource "aws_lb_target_group" "order" {
  name        = "${var.name_prefix}-order"
  port        = 8082
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

resource "aws_lb_listener" "internal_http" {
  load_balancer_arn = aws_lb.internal.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "application/json"
      message_body = "{\"error\":\"not found\"}"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener_rule" "users" {
  listener_arn = aws_lb_listener.internal_http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.user.arn
  }

  condition {
    path_pattern {
      values = ["/users", "/users/*"]
    }
  }
}

resource "aws_lb_listener_rule" "orders" {
  listener_arn = aws_lb_listener.internal_http.arn
  priority     = 20

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.order.arn
  }

  condition {
    path_pattern {
      values = ["/orders", "/orders/*"]
    }
  }
}

# --- Task definitions (container health checks) ---

resource "aws_ecs_task_definition" "user" {
  family                   = "gateway-lab-user"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name      = "user-service"
    image     = local.ecr_user_service
    essential = true
    portMappings = [{
      containerPort = 8081
      protocol      = "tcp"
    }]
    environment = [
      { name = "SPRING_PROFILES_ACTIVE", value = "aws" },
      { name = "SERVER_PORT", value = "8081" },
      { name = "INSTANCE_ID", value = "user-ecs" }
    ]
    healthCheck = {
      command     = ["CMD-SHELL", "curl -fsS http://localhost:8081/actuator/health || exit 1"]
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
        awslogs-stream-prefix = "user"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "order" {
  family                   = "gateway-lab-order"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name      = "order-service"
    image     = local.ecr_order_service
    essential = true
    portMappings = [{
      containerPort = 8082
      protocol      = "tcp"
    }]
    environment = [
      { name = "SPRING_PROFILES_ACTIVE", value = "aws" },
      { name = "SERVER_PORT", value = "8082" },
      { name = "INSTANCE_ID", value = "order-ecs" }
    ]
    healthCheck = {
      command     = ["CMD-SHELL", "curl -fsS http://localhost:8082/actuator/health || exit 1"]
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
        awslogs-stream-prefix = "order"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "gateway" {
  family                   = "gateway-lab-api-gateway"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name      = "api-gateway"
    image     = local.ecr_api_gateway
    essential = true
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = [
      { name = "SPRING_PROFILES_ACTIVE", value = "aws" },
      { name = "SERVER_PORT", value = "8080" },
      { name = "USER_SERVICE_URI", value = local.user_service_uri },
      { name = "ORDER_SERVICE_URI", value = local.order_service_uri }
    ]
    healthCheck = {
      command     = ["CMD-SHELL", "curl -fsS http://localhost:8080/actuator/health || exit 1"]
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
        awslogs-stream-prefix = "gateway"
      }
    }
  }])
}

# --- ECS services ---

resource "aws_ecs_service" "user" {
  name                              = "user-service"
  cluster                           = aws_ecs_cluster.this.id
  task_definition                   = aws_ecs_task_definition.user.arn
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
    target_group_arn = aws_lb_target_group.user.arn
    container_name   = "user-service"
    container_port   = 8081
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  depends_on = [aws_lb_listener_rule.users]
}

resource "aws_ecs_service" "order" {
  name                              = "order-service"
  cluster                           = aws_ecs_cluster.this.id
  task_definition                   = aws_ecs_task_definition.order.arn
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
    target_group_arn = aws_lb_target_group.order.arn
    container_name   = "order-service"
    container_port   = 8082
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  depends_on = [aws_lb_listener_rule.orders]
}

resource "aws_ecs_service" "gateway" {
  name                              = "api-gateway"
  cluster                           = aws_ecs_cluster.this.id
  task_definition                   = aws_ecs_task_definition.gateway.arn
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
    target_group_arn = aws_lb_target_group.gateway.arn
    container_name   = "api-gateway"
    container_port   = 8080
  }

  depends_on = [
    aws_lb_listener.http,
    aws_ecs_service.user,
    aws_ecs_service.order
  ]

  lifecycle {
    ignore_changes = [desired_count]
  }
}
