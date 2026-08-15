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

## ALB in front of Spring API Gateway — what we configured

There are **two** load-balancing layers. Do not confuse them:

```text
Clients
   │
   ▼
① Public ALB :80          ← AWS Application Load Balancer (this section)
   │  target type = ip (Fargate awsvpc)
   │  health = GET /actuator/health → 200
   ▼
api-gateway tasks :8080   ← Spring Cloud Gateway (ECS service)
   │  USER_SERVICE_URI / ORDER_SERVICE_URI
   ▼
② Cloud Map DNS           ← not an ALB; MULTIVALUE A records for user/order
```

### Steps (matches `aws/terraform/main.tf`)

1. **Security group for the ALB** (`aws_security_group.alb`)
   - Inbound: TCP **80** from `0.0.0.0/0`
   - Outbound: all (so ALB can reach gateway tasks)

2. **Security group for ECS tasks** (`aws_security_group.services`)
   - Inbound **8080** only from the **ALB SG** (edge → gateway)
   - Inbound **8081–8082** from **self** (gateway → user/order east-west)

3. **Create internet-facing ALB** (`aws_lb.public`)
   - Type: `application`
   - `internal = false`
   - Subnets: `var.public_subnet_ids` (≥2 AZs)
   - Attach ALB security group

4. **Target group for api-gateway** (`aws_lb_target_group.gateway`)
   - Protocol/port: HTTP **8080**
   - `target_type = ip` (required for Fargate `awsvpc`)
   - Health check: path `/actuator/health`, matcher `200`, interval 15s

5. **HTTP listener** (`aws_lb_listener.http`)
   - Port **80**
   - Default action: **forward** → gateway target group  
   - (No path rules yet — all traffic goes to Spring Cloud Gateway)

6. **Register gateway with the ALB** (`aws_ecs_service.gateway` → `load_balancer { ... }`)
   - `container_name = api-gateway`
   - `container_port = 8080`
   - `target_group_arn` = gateway TG  
   - ECS automatically registers/deregisters task IPs as tasks scale

7. **Spring Cloud Gateway (app config, not ALB)**
   - Profile `aws`: routes `/api/users/**` and `/api/orders/**`
   - Downstream URIs from env (Cloud Map), **not** Eureka:
     - `USER_SERVICE_URI=http://user-service.gateway-lab.local:8081`
     - `ORDER_SERVICE_URI=http://order-service.gateway-lab.local:8082`

8. **Verify**
   ```bash
   terraform output alb_url
   curl -i http://<alb-dns>/actuator/health
   curl -i http://<alb-dns>/api/users/101
   curl -i http://<alb-dns>/api/orders/5001
   ```

### What is *not* behind the public ALB today

| Service | How traffic reaches it |
|---------|------------------------|
| `api-gateway` | Public ALB → TG → tasks |
| `user-service` | Only via gateway + Cloud Map (no public ALB) |
| `order-service` | Only via gateway + Cloud Map (no public ALB) |

### Console equivalent (same design)

1. EC2 → Load Balancers → Create **Application Load Balancer** (internet-facing, port 80)  
2. Create target group (IP, port 8080, health `/actuator/health`)  
3. Listener 80 → forward to that TG  
4. ECS service `api-gateway` → Load balancing → attach that TG, container port 8080  
5. SG rules as above  

Terraform already encodes steps 1–6; you only set `vpc_id` + `public_subnet_ids` in `terraform.tfvars`.

---

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
