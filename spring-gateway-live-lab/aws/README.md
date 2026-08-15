# AWS production deployment (Terraform) — reliable, scalable, fault-tolerant

No Eureka. Platform LBs + Spring Cloud Gateway resilience.

```text
Internet (+ WAF rate limit)
   │
   ▼
Public ALB :80/:443  ──health /actuator/health──► api-gateway (×N, autoscaled)
   │                                              │
   │                                              │ timeouts + Retry(GET) + CircuitBreaker
   │                                              ▼
   │                                         Internal ALB :80
   │                                              ├─ /users*  → user-service (×N)
   │                                              └─ /orders* → order-service (×N)
```

## Reliability / fault tolerance (what we built)

| Layer | Capability |
|-------|------------|
| App gateway | Connect 2s / response 5s timeouts |
| App gateway | Retry **GET** only (idempotent) |
| App gateway | Resilience4j **CircuitBreaker** + `/fallback/*` → 503 DEGRADED |
| App services | Graceful shutdown, Tomcat timeouts |
| Edge ALB | Health checks, deregistration delay, drop invalid headers |
| Internal ALB | Path routing + health checks (no JVM DNS cache issues) |
| ECS | Deployment circuit breaker + rollback, container health checks |
| Autoscaling | CPU + ALB RequestCountPerTarget (min 2 / max 6) |
| WAF | Per-IP rate limit on public ALB |
| Ops | CloudWatch alarms (5xx, unhealthy hosts, CPU) |

## Scalability

- Horizontal: ECS desiredCount + Application Auto Scaling  
- Edge: public ALB spreads across gateway tasks  
- East-west: internal ALB spreads across user/order tasks  

## Deploy (production)

### Prerequisites
- VPC with **2 public** + **2 private** subnets (NAT for ECR pulls from private)
- Terraform ≥ 1.5, AWS CLI, Docker
- Optional: ACM certificate in the same region

### Steps

```bash
cd spring-gateway-live-lab/aws/terraform
cp terraform.tfvars.example terraform.tfvars
# set vpc_id, public_subnet_ids, private_subnet_ids
# set alb_ingress_cidrs to your VPN/office CIDR
# optional: acm_certificate_arn, alarm_email

terraform init
terraform apply -target=aws_ecr_repository.api_gateway \
  -target=aws_ecr_repository.user_service \
  -target=aws_ecr_repository.order_service

cd ../..
./scripts/build-push-ecr.sh

cd aws/terraform
terraform apply
terraform output alb_url
GATEWAY_URL="$(terraform output -raw alb_url)" ../../scripts/smoke-aws.sh
```

### Local stand-in (Compose DNS ≈ internal ALB)

```bash
docker compose -f docker-compose.aws.yml up --build
./scripts/smoke-aws.sh
```

Same `SPRING_PROFILES_ACTIVE=aws` profile (CB + timeouts enabled).

## ALB configuration steps (public → gateway)

1. Public ALB SG — 80/443 from `alb_ingress_cidrs`  
2. Target group — IP, port 8080, health `/actuator/health`  
3. Listener — 80 forward (or redirect to 443 if ACM set)  
4. ECS `api-gateway` registers on that TG  
5. Optional WAF association — rate-based rule  

## Internal ALB (gateway → user/order)

1. Internal ALB in private (or public) subnets  
2. TG user :8081, TG order :8082  
3. Listener rules: `/users*` → user, `/orders*` → order  
4. Gateway env: `USER_SERVICE_URI=http://<internal-alb-dns>` (same host; path decides TG)  

## Still your responsibility before go-live

- JWT / Cognito / mTLS for real authZ (not in this lab yet)  
- Secrets Manager for any credentials  
- Multi-AZ NAT, deletion protection, tighter IAM task roles  
- Load / chaos test CB and autoscaling thresholds  

## Interview answer

> “Production path drops Eureka. Clients hit a WAF-protected public ALB into Spring Cloud Gateway. The gateway uses timeouts, GET retries, and Resilience4j circuit breakers with fallbacks. Downstream calls go through an internal ALB so AWS—not the JVM—load-balances and health-checks user and order. ECS autoscaling and deployment circuit breakers handle scale and bad deploys.”
