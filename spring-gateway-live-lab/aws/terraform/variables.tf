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
  description = "At least two public subnets for the internet-facing ALB + Fargate tasks"
}

variable "desired_count" {
  type        = number
  description = "Desired tasks per ECS service"
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

variable "cloud_map_namespace" {
  type        = string
  description = "Private DNS namespace for service discovery (no Eureka)"
  default     = "gateway-lab.local"
}

variable "assign_public_ip" {
  type        = bool
  description = "Lab default true (public subnets). Production: false + private subnets + NAT."
  default     = true
}
