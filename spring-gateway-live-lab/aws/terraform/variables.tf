variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "us-east-1"
}

variable "name_prefix" {
  type        = string
  description = "Name prefix for resources"
  default     = "gateway-live-lab"
}

variable "vpc_id" {
  type        = string
  description = "Existing VPC id"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Public subnets for the internet-facing ALB (≥2 AZs)"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnets for ECS tasks + internal ALB (production). Empty = use public subnets (lab)."
  default     = []
}

variable "desired_count" {
  type        = number
  description = "Initial desired tasks per ECS service"
  default     = 2
}

variable "container_cpu" {
  type    = number
  default = 256
}

variable "container_memory" {
  type    = number
  default = 512
}

variable "image_tag" {
  type        = string
  description = "ECR image tag pushed by scripts/build-push-ecr.sh"
  default     = "latest"
}

variable "assign_public_ip" {
  type        = bool
  description = "Only used when private_subnet_ids is empty. Production: set private subnets (forces false)."
  default     = true
}

variable "alb_ingress_cidrs" {
  type        = list(string)
  description = "CIDRs allowed to hit the public ALB (restrict in production)"
  default     = ["0.0.0.0/0"]
}

variable "acm_certificate_arn" {
  type        = string
  description = "Optional ACM cert ARN — when set, public ALB listens on 443 and redirects 80→443"
  default     = ""
}

variable "enable_waf" {
  type        = bool
  description = "Attach WAFv2 rate-based rule to the public ALB"
  default     = true
}

variable "waf_rate_limit" {
  type        = number
  description = "Max requests per 5-minute window per IP (WAFv2 rate rule)"
  default     = 2000
}

variable "alarm_email" {
  type        = string
  description = "Optional SNS email for CloudWatch alarms (empty = no subscription)"
  default     = ""
}
