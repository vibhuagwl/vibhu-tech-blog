# AWS deployment (no Eureka)

## Why not Eureka on AWS?

| Concern | Local lab (Phases 2–3) | AWS (this folder) |
|---------|------------------------|-------------------|
| Registry | Eureka `:8761` | **Cloud Map** / ALB target groups |
| Gateway URI | `lb://user-service` | `http://user-service.gateway-lab.local:8081` |
| Load balance | Spring Cloud LoadBalancer | **ALB** (edge) + Cloud Map MULTIVALUE / internal ALB |
| Profile | default | `SPRING_PROFILES_ACTIVE=aws` |

Eureka duplicates what AWS already provides. Keep Eureka for learning; ship AWS with platform discovery.

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

No AWS account required — same Spring `aws` profile:

```bash
cd spring-gateway-live-lab
docker compose -f docker-compose.aws.yml up --build
./scripts/smoke-aws.sh
```

## 2) Real AWS (ECR + ECS Fargate + ALB)

```bash
# Build & push images
./scripts/build-push-ecr.sh

# Deploy (replace VPC/subnets)
aws cloudformation deploy \
  --stack-name gateway-live-lab \
  --template-file aws/cloudformation.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    VpcId=vpc-xxxxxxxx \
    PublicSubnetIds=subnet-aaa,subnet-bbb \
    ApiGatewayImage=<account>.dkr.ecr.<region>.amazonaws.com/gateway-lab/api-gateway:latest \
    UserServiceImage=<account>.dkr.ecr.<region>.amazonaws.com/gateway-lab/user-service:latest \
    OrderServiceImage=<account>.dkr.ecr.<region>.amazonaws.com/gateway-lab/order-service:latest

# URL
aws cloudformation describe-stacks --stack-name gateway-live-lab \
  --query "Stacks[0].Outputs[?OutputKey=='AlbDnsName'].OutputValue" --output text

GATEWAY_URL=http://<alb-dns> ./scripts/smoke-aws.sh
```

## Production hardening (next steps on AWS)

1. **Internal ALB** in front of user/order (better than raw Cloud Map DNS caching in the JVM).
2. **Private subnets** + NAT (do not `AssignPublicIp` on tasks).
3. **HTTPS** ACM cert on the public ALB; restrict SG ingress.
4. **Secrets** via AWS Secrets Manager / SSM, not env plaintext.
5. **JWT / Cognito** at the gateway (lab Phase 4) or AWS API Gateway authorizer.
6. On EKS instead of ECS: drop Cloud Map; use Kubernetes Service DNS (`http://user-service:8081`).

## Interview answer

> “On AWS I would not run Eureka. Clients reach a public ALB in front of Spring Cloud Gateway. Downstream URIs come from env pointing at Cloud Map or an internal ALB. Horizontal scale is an ECS desiredCount / ALB target-group problem, not a Netflix OSS registry problem.”
