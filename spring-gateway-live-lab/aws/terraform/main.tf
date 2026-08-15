data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = var.aws_region

  ecr_api_gateway   = "${aws_ecr_repository.api_gateway.repository_url}:${var.image_tag}"
  ecr_user_service  = "${aws_ecr_repository.user_service.repository_url}:${var.image_tag}"
  ecr_order_service = "${aws_ecr_repository.order_service.repository_url}:${var.image_tag}"

  user_service_uri  = "http://user-service.${var.cloud_map_namespace}:8081"
  order_service_uri = "http://order-service.${var.cloud_map_namespace}:8082"
}

# --- ECR (Terraform owns registries; build-push-ecr.sh pushes into them) ---

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

# --- Cloud Map (replaces Eureka) ---

resource "aws_service_discovery_private_dns_namespace" "this" {
  name = var.cloud_map_namespace
  vpc  = var.vpc_id
}

resource "aws_service_discovery_service" "user" {
  name = "user-service"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.this.id
    dns_records {
      ttl  = 5
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {}
}

resource "aws_service_discovery_service" "order" {
  name = "order-service"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.this.id
    dns_records {
      ttl  = 5
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {}
}

# --- Security groups ---

resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-alb"
  description = "Public ALB for api-gateway"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

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

  ingress {
    description     = "ALB to gateway"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "East-west user/order"
    from_port   = 8081
    to_port     = 8082
    protocol    = "tcp"
    self        = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- Public ALB → api-gateway ---

resource "aws_lb" "public" {
  name               = "${var.name_prefix}-alb"
  load_balancer_type = "application"
  internal           = false
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids
}

resource "aws_lb_target_group" "gateway" {
  name        = "${var.name_prefix}-gw"
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    path                = "/actuator/health"
    matcher             = "200"
    interval            = 15
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.public.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.gateway.arn
  }
}

# --- Task definitions ---

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
  name            = "user-service"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.user.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [aws_security_group.services.id]
    assign_public_ip = var.assign_public_ip
  }

  service_registries {
    registry_arn = aws_service_discovery_service.user.arn
  }
}

resource "aws_ecs_service" "order" {
  name            = "order-service"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.order.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [aws_security_group.services.id]
    assign_public_ip = var.assign_public_ip
  }

  service_registries {
    registry_arn = aws_service_discovery_service.order.arn
  }
}

resource "aws_ecs_service" "gateway" {
  name            = "api-gateway"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.gateway.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [aws_security_group.services.id]
    assign_public_ip = var.assign_public_ip
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
}
