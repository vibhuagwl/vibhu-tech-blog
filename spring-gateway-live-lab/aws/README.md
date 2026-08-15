# AWS deployment with Terraform (no Eureka)

## Why not Eureka on AWS?

| Concern | Local lab (Phases 2–3) | AWS (Terraform) |
|---------|------------------------|-----------------|
| Registry | Eureka `:8761` | **Cloud Map** |
| Gateway URI | `lb://user-service` | `http://user-service.gateway-lab.local:8081` |
| Load balance | Spring Cloud LoadBalancer | **ALB** (edge) + Cloud Map MULTIVALUE |
| IaC | — | **Terraform** under `aws/terraform/` |
| Profile | default | `SPRING_PROFILES_ACTIVE=aws` |

```text
Internet
   │
   ▼
Public ALB :80
   │
   ▼
api-gateway (ECS Fargate)  profile=aws
   │  USER_SERVICE_URI=http://user-service.gateway-lab.local:8081
   │  ORDER_SERVICE_URI=http://order-service.gateway-lab.local:8082
   ├──────────────► user-service tasks  (Cloud Map A records)
   └──────────────► order-service tasks
```

## 1) Prove locally (Docker DNS ≈ Cloud Map)

```bash
cd spring-gateway-live-lab
docker compose -f docker-compose.aws.yml up --build
./scripts/smoke-aws.sh
```

## 2) Real AWS with Terraform

### Prerequisites
- Terraform `>= 1.5`
- AWS CLI credentials
- Docker (to build/push images)
- Existing VPC + **2 public subnets**

### Steps

```bash
cd spring-gateway-live-lab/aws/terraform
cp terraform.tfvars.example terraform.tfvars
# edit vpc_id + public_subnet_ids

terraform init

# 1) Create ECR repos (and optionally rest of stack)
terraform apply -target=aws_ecr_repository.api_gateway \
  -target=aws_ecr_repository.user_service \
  -target=aws_ecr_repository.order_service

# 2) Build & push images into those repos
cd ../..
./scripts/build-push-ecr.sh

# 3) Apply full stack (ECS + ALB + Cloud Map)
cd aws/terraform
terraform apply

# 4) Smoke
GATEWAY_URL="$(terraform output -raw alb_url)" ./../../scripts/smoke-aws.sh
```

One-shot after ECR already has images:

```bash
cd aws/terraform
terraform apply
terraform output alb_url
```

Destroy:

```bash
terraform destroy
```

### What Terraform creates
- ECR: `gateway-lab/api-gateway`, `user-service`, `order-service`
- ECS Fargate cluster + 3 services
- Public ALB → api-gateway target group
- Cloud Map private DNS `gateway-lab.local`
- IAM execution role, security groups, CloudWatch log group

## Production hardening

1. Internal ALB in front of user/order (better than JVM DNS caching on Cloud Map).
2. Private subnets + NAT (`assign_public_ip = false`).
3. HTTPS listener + ACM.
4. Secrets Manager / SSM for config.
5. JWT / Cognito at the gateway.
6. On EKS: drop Cloud Map; use Kubernetes Service DNS.

## Interview answer

> “On AWS I would not run Eureka. Terraform provisions ECS Fargate, a public ALB in front of Spring Cloud Gateway, and Cloud Map for downstream DNS. Gateway URIs come from env vars. Scaling is desiredCount and ALB health checks — not a Netflix registry.”
