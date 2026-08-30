import type {AwsTopic} from './types';

export const TOPICS_COMPUTE: AwsTopic[] = [
  {
    id: 'ec2',
    title: 'EC2 · ASG · Launch Templates · Spot/Reserved · Scaling Policies',
    badge: 'EC2',
    category: 'Compute',
    askLevel: '🔥 SENIOR',
    what:
      'EC2 instances behind an ALB, grouped in an Auto Scaling Group (ASG) driven by a Launch Template. Mix On-Demand (baseline), Reserved/Savings Plans (steady load), and Spot (batch/fault-tolerant). Scale on CPU, ALB request count per target, or target-tracking on a custom metric.',
    mermaid: `flowchart LR
  Client[Client / Mobile App]
  ALB[Application Load Balancer]
  TG[Target Group]
  ASG[Auto Scaling Group]
  EC2A[EC2 Spring Boot]
  EC2B[EC2 Spring Boot]
  Client --> ALB --> TG --> ASG
  ASG --> EC2A
  ASG --> EC2B`,
    code: `# ── Launch Template (versioned, immutable) ──
aws ec2 create-launch-template \\
  --launch-template-name payment-api-lt \\
  --launch-template-data '{
    "ImageId": "ami-0abcdef1234567890",
    "InstanceType": "m6i.large",
    "IamInstanceProfile": {"Name": "payment-api-ec2-role"},
    "SecurityGroupIds": ["sg-app-private"],
    "UserData": "'$(base64 -w0 user-data.sh)'",
    "MetadataOptions": {"HttpTokens": "required", "HttpPutResponseHopLimit": 1},
    "BlockDeviceMappings": [{
      "DeviceName": "/dev/xvda",
      "Ebs": {"VolumeSize": 30, "VolumeType": "gp3", "Encrypted": true}
    }],
    "TagSpecifications": [{
      "ResourceType": "instance",
      "Tags": [{"Key": "Name", "Value": "payment-api"}, {"Key": "Env", "Value": "prod"}]
    }]
  }'

# user-data.sh — Spring Boot on Amazon Linux 2023 (no secrets in AMI)
#!/bin/bash
set -euo pipefail
dnf install -y java-17-amazon-corretto-headless amazon-cloudwatch-agent
aws secretsmanager get-secret-value \\
  --secret-id prod/payment-db \\
  --query SecretString --output text > /opt/payment-db.json
cat > /opt/payment-api.env <<EOF
SPRING_PROFILES_ACTIVE=prod
SPRING_CONFIG_IMPORT=aws-secretsmanager:prod/payment-db
SERVER_PORT=8080
EOF
# Fetch JAR from private S3 artifact bucket (instance role needs s3:GetObject)
aws s3 cp s3://\${ARTIFACT_BUCKET}/payment-api-\${APP_VERSION}.jar /opt/payment-api.jar
systemd-run --unit=payment-api \\
  java -Xms512m -Xmx1536m -jar /opt/payment-api.jar

# ── ASG with mixed Spot + On-Demand ──
aws autoscaling create-auto-scaling-group \\
  --auto-scaling-group-name payment-api-asg \\
  --launch-template LaunchTemplateName=payment-api-lt,Version='$Latest' \\
  --min-size 2 --max-size 20 --desired-capacity 4 \\
  --vpc-zone-identifier "subnet-private-a,subnet-private-b" \\
  --target-group-arns "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/payment-api-tg/abc123" \\
  --health-check-type ELB --health-check-grace-period 180 \\
  --mixed-instances-policy '{
    "LaunchTemplate": {"LaunchTemplateSpecification": {"LaunchTemplateName": "payment-api-lt", "Version": "$Latest"}},
    "InstancesDistribution": {
      "OnDemandBaseCapacity": 2,
      "OnDemandPercentageAboveBaseCapacity": 25,
      "SpotAllocationStrategy": "capacity-optimized"
    }
  }'

# ── Scaling policies ──
# 1) Target tracking — CPU 60%
aws autoscaling put-scaling-policy \\
  --auto-scaling-group-name payment-api-asg \\
  --policy-name cpu-target-60 \\
  --policy-type TargetTrackingScaling \\
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {"PredefinedMetricType": "ASGAverageCPUUtilization"},
    "TargetValue": 60.0,
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'

# 2) Target tracking — ALB requests per target
aws autoscaling put-scaling-policy \\
  --auto-scaling-group-name payment-api-asg \\
  --policy-name alb-requests-per-target \\
  --policy-type TargetTrackingScaling \\
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ALBRequestCountPerTarget",
      "ResourceLabel": "app/payment-alb/abc123/targetgroup/payment-api-tg/def456"
    },
    "TargetValue": 1000.0
  }'

# 3) Step scaling — custom CloudWatch metric (payment queue depth)
aws autoscaling put-scaling-policy \\
  --auto-scaling-group-name payment-api-asg \\
  --policy-name queue-depth-step \\
  --adjustment-type ChangeInCapacity \\
  --policy-type StepScaling \\
  --step-scaling-policy-configuration '{
    "MetricAggregationType": "Average",
    "Cooldown": 120,
    "StepAdjustments": [
      {"MetricIntervalLowerBound": 0, "MetricIntervalUpperBound": 50, "ScalingAdjustment": 1},
      {"MetricIntervalLowerBound": 50, "ScalingAdjustment": 3}
    ]
  }'

# ── Reserved / Savings Plans (finance ops — not ASG config) ──
# Compute SP or EC2 RI for baseline 2× m6i.large 24×7; Spot covers burst above base.
# Use Cost Explorer → RI/SP recommendations; validate utilization monthly.`,
    verify: `# ASG health and capacity
aws autoscaling describe-auto-scaling-groups \\
  --auto-scaling-group-names payment-api-asg \\
  --query 'AutoScalingGroups[0].{Desired:DesiredCapacity,InService:Instances[?LifecycleState==\`InService\`] | length(@)}'

# Target group healthy targets
aws elbv2 describe-target-health \\
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/payment-api-tg/abc123

# Active scaling policies
aws autoscaling describe-policies --auto-scaling-group-name payment-api-asg

# Spot interruption notice (instance metadata)
TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -sH "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/spot/instance-action`,
    pitfalls:
      'Launch Configuration (deprecated) instead of Launch Template — no versioning, no mixed instances. Scaling on CPU alone while blocked on DB pool. Health check grace too short → scale-in during boot. Spot for stateful payment workers without checkpoint. No IMDSv2 (HttpTokens=required). Secrets baked into AMI or user-data plaintext.',
    production:
      'Payment API ASG: 2 On-Demand base + Spot burst, ALB request-per-target scaling, 180s grace, IMDSv2, instance profile for Secrets Manager (no access keys). FinTech pattern: baseline covered by Compute SP; validate with load test before Spot for non-idempotent paths.',
    interview30s:
      'Launch Template (versioned) → ASG → ALB target group. Scale on CPU, ALB request count, or custom metrics via target/step policies. Mix On-Demand base + Spot burst; RI/SP for steady baseline.',
    interview2m:
      'Walk launch: LT defines AMI, instance type, SG, IAM instance profile, encrypted gp3, IMDSv2. User-data pulls secrets from Secrets Manager and starts Spring Boot — never embed credentials. ASG registers with TG; ALB health checks gate traffic. Target-tracking on ALBRequestCountPerTarget ties scale to real RPS. Spot saves ~60–70% but needs interruption handling (2-min notice via metadata). Reserved/SP for 24×7 baseline; Spot for batch settlement workers.',
    traps:
      '"We scale on CPU" while latency is DB-bound — adds cost, not throughput. Using Launch Configuration in 2024+. Putting \${DB_PASSWORD} in user-data instead of Secrets Manager.',
  },
  {
    id: 'ecs',
    title: 'ECS · Task Definition · Service · Fargate vs EC2 · IAM Roles',
    badge: 'ECS',
    category: 'Compute',
    askLevel: '🔥 SENIOR',
    what:
      'ECS runs containers on Fargate (serverless) or EC2-backed capacity. Task Definition = container blueprint (image, CPU/mem, env, roles). Service maintains desired task count, rolling deploys, and ALB registration. Task role = app AWS API access; execution role = ECR pull + logs + secrets injection.',
    mermaid: `flowchart LR
  ALB[Application Load Balancer]
  SVC[ECS Service]
  T1[Task / payment-api]
  T2[Task / payment-api]
  C1[Container Spring Boot]
  C2[Container Spring Boot]
  ALB --> SVC
  SVC --> T1 --> C1
  SVC --> T2 --> C2`,
    code: `# ── Task Definition (Fargate, Spring Boot payment-api) ──
aws ecs register-task-definition --cli-input-json '{
  "family": "payment-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/payment-api-task-role",
  "containerDefinitions": [{
    "name": "payment-api",
    "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-api:1.4.2",
    "essential": true,
    "portMappings": [{"containerPort": 8080, "protocol": "tcp"}],
    "environment": [
      {"name": "SPRING_PROFILES_ACTIVE", "value": "prod"},
      {"name": "AWS_REGION", "value": "us-east-1"}
    ],
    "secrets": [
      {"name": "SPRING_DATASOURCE_PASSWORD", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/payment-db-AbCdEf:password::"},
      {"name": "JWT_SIGNING_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/jwt-key-XyZ123:signingKey::"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/payment-api",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "payment"
      }
    },
    "healthCheck": {
      "command": ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health/readiness || exit 1"],
      "interval": 15, "timeout": 5, "retries": 3, "startPeriod": 60
    },
    "stopTimeout": 30
  }]
}'

# ── IAM roles (least privilege) ──
# ecsTaskExecutionRole: AmazonECSTaskExecutionRolePolicy + secretsmanager:GetSecretValue on prod/*
# payment-api-task-role (task role — app runtime):
{
  "Version": "2012-10-17",
  "Statement": [
    {"Effect": "Allow", "Action": ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:Query"],
     "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/payment-ledger"},
    {"Effect": "Allow", "Action": ["sqs:SendMessage"],
     "Resource": "arn:aws:sqs:us-east-1:123456789012:payment-events.fifo"},
    {"Effect": "Allow", "Action": ["kms:Decrypt"],
     "Resource": "arn:aws:kms:us-east-1:123456789012:key/abcd-1234"}
  ]
}

# ── ECS Service with ALB + rolling deployment ──
aws ecs create-service \\
  --cluster payment-prod \\
  --service-name payment-api \\
  --task-definition payment-api \\
  --desired-count 4 \\
  --launch-type FARGATE \\
  --network-configuration 'awsvpcConfiguration={
    subnets=[subnet-private-a,subnet-private-b],
    securityGroups=[sg-ecs-tasks],
    assignPublicIp=DISABLED}' \\
  --load-balancers 'targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/payment-ecs-tg/abc,
    containerName=payment-api,containerPort=8080' \\
  --deployment-configuration '{
    "maximumPercent": 200,
    "minimumHealthyPercent": 100,
    "deploymentCircuitBreaker": {"enable": true, "rollback": true}
  }' \\
  --health-check-grace-period-seconds 90

# ── Deploy new image (blue/green via CodeDeploy optional) ──
aws ecs update-service \\
  --cluster payment-prod \\
  --service payment-api \\
  --task-definition payment-api:7 \\
  --force-new-deployment

# ── Fargate vs EC2 launch type ──
# Fargate: no host patching, per-task billing, 4 vCPU / 30 GB max per task
# EC2: EC2 ASG as capacity provider — better $/CPU at scale, Daemon tasks, GPU, custom AMIs
aws ecs put-cluster-capacity-providers \\
  --cluster payment-prod \\
  --capacity-providers FARGATE FARGATE_SPOT payment-ec2-cp \\
  --default-capacity-provider-strategy \\
    capacityProvider=FARGATE,weight=1,base=2 \\
    capacityProvider=FARGATE_SPOT,weight=3`,
    verify: `# Service running count vs desired
aws ecs describe-services --cluster payment-prod --services payment-api \\
  --query 'services[0].{desired:desiredCount,running:runningCount,pending:pendingCount,deployments:deployments}'

# Task health and stop reason
aws ecs list-tasks --cluster payment-prod --service-name payment-api
aws ecs describe-tasks --cluster payment-prod --tasks <task-arn> \\
  --query 'tasks[0].{lastStatus:lastStatus,health:healthStatus,stopReason:stoppedReason}'

# Verify task role (from inside task via ECS metadata)
curl -s $ECS_CONTAINER_METADATA_URI_V4/task | jq .TaskARN

# ECR image pull / execution role test
aws ecr describe-images --repository-name payment-api --image-ids imageTag=1.4.2`,
    pitfalls:
      'Confusing task role vs execution role — app cannot call DynamoDB if only execution role has permissions. Fargate task in public subnet with assignPublicIp=ENABLED. No deployment circuit breaker → bad image takes down service. CPU/memory hard limits cause OOMKill without JVM -Xmx tuning. Secrets in environment plaintext instead of secrets array.',
    production:
      'FinTech payment-api on Fargate: awsvpc, private subnets, task role for DynamoDB/SQS/KMS, execution role for ECR+logs+Secrets Manager. Circuit breaker rollback enabled. Readiness probe on /actuator/health/readiness. FARGATE_SPOT for non-critical batch tasks; On-Demand Fargate for synchronous payment API.',
    interview30s:
      'Task Definition = container spec + task/execution IAM roles. Service keeps N tasks behind ALB. Fargate = serverless; EC2 capacity provider = cheaper at scale. Task role for app AWS calls; execution role for platform (ECR, logs, secrets).',
    interview2m:
      'Register task def with ECR image, secrets from Secrets Manager (injected as env), awslogs driver. Create service with TG attachment, minHealthyPercent=100 for zero-downtime rolling deploy. Compare Fargate (ops simplicity, per-task pricing) vs EC2-backed (bin-packing, Spot capacity provider, Daemon sidecars). FinTech: circuit breaker prevents bad deploy; stopTimeout=30 for graceful drain; task role scoped to payment-ledger table only.',
    traps:
      'Putting S3/DynamoDB permissions on execution role — belongs on task role. "Fargate is always cheaper" — at sustained high CPU, EC2 capacity provider often wins.',
  },
  {
    id: 'eks',
    title: 'EKS · Node Groups · Pod/Deployment/Service/Ingress · HPA · IRSA',
    badge: 'EKS',
    category: 'Compute',
    askLevel: '🏆 STAFF',
    what:
      'EKS is managed Kubernetes: node groups (EC2 or Fargate) run pods scheduled by Deployments. Service exposes pods; Ingress (AWS Load Balancer Controller) provisions ALB. HPA scales replicas on CPU/custom metrics. IRSA maps K8s service accounts to IAM roles — no node-wide credentials.',
    mermaid: `flowchart LR
  R53[Route 53]
  ALB[ALB Ingress]
  ING[Ingress]
  SVC[Service ClusterIP]
  POD1[Pod payment-api]
  POD2[Pod payment-api]
  R53 --> ALB --> ING --> SVC
  SVC --> POD1
  SVC --> POD2`,
    code: `# ── EKS cluster + managed node group (outline) ──
eksctl create cluster \\
  --name payment-prod \\
  --region us-east-1 \\
  --version 1.29 \\
  --vpc-private-subnets subnet-private-a,subnet-private-b \\
  --managed \\
  --nodegroup-name payment-ng \\
  --node-type m6i.large \\
  --nodes 3 --nodes-min 2 --nodes-max 10 \\
  --asg-access \\
  --with-oidc

# ── IRSA — IAM role for payment-api service account ──
eksctl create iamserviceaccount \\
  --cluster payment-prod \\
  --name payment-api \\
  --namespace payments \\
  --attach-policy-arn arn:aws:iam::123456789012:policy/payment-api-policy \\
  --approve

# payment-api-policy (DynamoDB + SQS + KMS — same scope as ECS task role)
# Trust policy uses OIDC: system:serviceaccount:payments:payment-api

# ── Deployment + Service + Ingress ──
kubectl apply -f - <<'YAML'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
  namespace: payments
spec:
  replicas: 3
  selector:
    matchLabels: {app: payment-api}
  template:
    metadata:
      labels: {app: payment-api}
    spec:
      serviceAccountName: payment-api   # IRSA
      containers:
      - name: payment-api
        image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-api:2.1.0
        ports: [{containerPort: 8080}]
        resources:
          requests: {cpu: "500m", memory: "1Gi"}
          limits:   {cpu: "1000m", memory: "2Gi"}
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: prod
        - name: AWS_REGION
          value: us-east-1
        readinessProbe:
          httpGet: {path: /actuator/health/readiness, port: 8080}
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet: {path: /actuator/health/liveness, port: 8080}
          initialDelaySeconds: 60
        securityContext:
          runAsNonRoot: true
          allowPrivilegeEscalation: false
---
apiVersion: v1
kind: Service
metadata:
  name: payment-api
  namespace: payments
spec:
  selector: {app: payment-api}
  ports: [{port: 80, targetPort: 8080}]
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: payment-api
  namespace: payments
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/abc-123
    alb.ingress.kubernetes.io/healthcheck-path: /actuator/health/readiness
spec:
  rules:
  - host: api.payments.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service: {name: payment-api, port: {number: 80}}
YAML

# ── Horizontal Pod Autoscaler ──
kubectl autoscale deployment payment-api -n payments \\
  --cpu-percent=60 --min=3 --max=20

# Custom metric HPA (ALB request count via prometheus-adapter or KEDA)
# apiVersion: autoscaling/v2 — metrics: type Pods, pods.metric.name: alb_request_count

# ── Cluster Autoscaler (node group scale) ──
# ASG tags: k8s.io/cluster-autoscaler/payment-prod=owned
# IAM: autoscaling:SetDesiredCapacity, ec2:DescribeInstances`,
    verify: `# Pod readiness and IRSA env injection
kubectl get pods -n payments -l app=payment-api
kubectl describe pod -n payments -l app=payment-api | grep -A5 'AWS_ROLE_ARN\\|AWS_WEB_IDENTITY_TOKEN_FILE'

# HPA status
kubectl get hpa -n payments payment-api
kubectl describe hpa -n payments payment-api

# Ingress → ALB ARN
kubectl get ingress -n payments payment-api -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Node group ASG
aws eks describe-nodegroup --cluster-name payment-prod --nodegroup-name payment-ng \\
  --query 'nodegroup.{status:status,scaling:scalingConfig,health:health}'`,
    pitfalls:
      'No resource requests → HPA and scheduler blind; pods OOM on noisy neighbors. IRSA not configured — devs mount node instance role (over-privileged). Ingress class mismatch (legacy vs ALB controller v2). Cluster Autoscaler without proper ASG tags → pending pods forever. Running system pods on same node group as app without taints/tolerations.',
    production:
      'EKS for platform teams running 20+ microservices: IRSA per service, PodDisruptionBudget minAvailable=2, CA + HPA layered. FinTech: NetworkPolicy deny-all + allow ALB→app→RDS SG path; secrets via External Secrets Operator → Secrets Manager; Fargate profiles for kube-system isolation optional.',
    interview30s:
      'EKS = managed K8s control plane. Node groups supply EC2; Deployments manage pods; Service + Ingress (ALB) expose traffic. HPA scales pods; Cluster Autoscaler scales nodes. IRSA = pod-level IAM via OIDC — no static keys.',
    interview2m:
      'Compare compute choices: EC2+ASG — max control, you patch OS, simplest mental model, good for monolith or fixed fleet. ECS — AWS-native containers, fastest path for few services, Fargate removes host ops, less K8s complexity. EKS — portable K8s, best when 15+ services, multi-cloud strategy, service mesh, CRDs; highest ops tax (control plane $/hr + node mgmt). Lambda — event/RPS-spiky, no host, 15-min cap, cold starts; ideal for webhooks, auth edge, stream processing. FinTech: EKS when platform team exists; ECS for 3–8 Java services; Lambda for fraud scoring on Kinesis; EC2 ASG for legacy core banking adapter.',
    traps:
      '"We use EKS for one Spring Boot app" — control plane cost + complexity rarely justified. Node instance role with s3:* instead of IRSA per deployment.',
  },
  {
    id: 'lambda',
    title: 'Lambda · Sync/Async · Cold Start · Provisioned Concurrency · DLQ · Integrations',
    badge: 'Lambda',
    category: 'Compute',
    askLevel: '🏆 STAFF',
    what:
      'Lambda runs code on demand: sync invoke (API Gateway, ALB) returns response; async invoke (S3, SNS, EventBridge) queues internally with retry + DLQ. Cold start = init + runtime bootstrap. Provisioned concurrency keeps execution environments warm. Common patterns: API→DynamoDB, SQS poller, MSK/Kafka event source.',
    mermaid: `flowchart TB
  APIGW[API Gateway]
  L[Lambda Handler]
  DDB[(DynamoDB)]
  SQS[SQS Queue]
  MSK[MSK Topic]
  DLQ[DLQ SQS]
  APIGW -->|sync| L --> DDB
  SQS -->|poll| L
  MSK -->|batch| L
  L -.->|failed async| DLQ`,
    code: `// ── Java 17 Lambda handler — API Gateway sync → DynamoDB ──
package com.example.payment;

import com.amazonaws.services.lambda.runtime.*;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import java.util.Map;

public class PaymentAuthorizeHandler implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {

  private static final DynamoDbClient DDB = DynamoDbClient.create(); // reuse across invocations
  private static final String TABLE = System.getenv("LEDGER_TABLE");

  @Override
  public APIGatewayV2HTTPResponse handleRequest(APIGatewayV2HTTPEvent event, Context ctx) {
    String idempotencyKey = event.getHeaders().getOrDefault("idempotency-key", "");
    if (idempotencyKey.isBlank()) {
      return response(400, "{\\"error\\":\\"missing idempotency-key\\"}");
    }
    try {
      DDB.putItem(PutItemRequest.builder()
          .tableName(TABLE)
          .item(Map.of(
              "pk", AttributeValue.builder().s("AUTH#" + idempotencyKey).build(),
              "status", AttributeValue.builder().s("AUTHORIZED").build(),
              "ttl", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis()/1000 + 86400)).build()))
          .conditionExpression("attribute_not_exists(pk)")
          .build());
      return response(200, "{\\"status\\":\\"AUTHORIZED\\"}");
    } catch (ConditionalCheckFailedException e) {
      return response(200, "{\\"status\\":\\"DUPLICATE\\"}");
    }
  }

  private APIGatewayV2HTTPResponse response(int code, String body) {
    return APIGatewayV2HTTPResponse.builder().withStatusCode(code).withBody(body).build();
  }
}

# ── Function config (AWS CLI) ──
aws lambda create-function \\
  --function-name payment-authorize \\
  --runtime java17 \\
  --handler com.example.payment.PaymentAuthorizeHandler \\
  --role arn:aws:iam::123456789012:role/payment-lambda-role \\
  --timeout 10 --memory-size 1024 \\
  --environment Variables="{LEDGER_TABLE=payment-ledger,AWS_LAMBDA_JAVA_TOOL_OPTIONS=-XX:+TieredCompilation -XX:TieredStopAtLevel=1}" \\
  --architectures arm64

# Provisioned concurrency — eliminate cold starts on hot path
aws lambda put-provisioned-concurrency-config \\
  --function-name payment-authorize \\
  --qualifier live \\
  --provisioned-concurrent-executions 20

# Async invoke config + DLQ
aws lambda invoke-async-config \\
  --function-name payment-settlement-worker \\
  --destination-config '{
    "OnFailure": {
      "Destination": "arn:aws:sqs:us-east-1:123456789012:payment-settlement-dlq"
    }
  }' \\
  --maximum-retry-attempts 2 \\
  --maximum-event-age-in-seconds 3600

# ── API Gateway HTTP API → Lambda (sync) ──
aws apigatewayv2 create-integration \\
  --api-id abc123 \\
  --integration-type AWS_PROXY \\
  --integration-uri arn:aws:lambda:us-east-1:123456789012:function:payment-authorize \\
  --payload-format-version 2.0

# ── SQS event source mapping (batch, partial failure) ──
aws lambda create-event-source-mapping \\
  --function-name payment-settlement-worker \\
  --event-source-arn arn:aws:sqs:us-east-1:123456789012:payment-settlement.fifo \\
  --batch-size 10 \\
  --function-response-types ReportBatchItemFailures \\
  --scaling-config MaximumConcurrency=50

# ── MSK (Kafka) event source ──
aws lambda create-event-source-mapping \\
  --function-name fraud-scoring \\
  --event-source-arn arn:aws:kafka:us-east-1:123456789012:cluster/payment-msk/uuid \\
  --topics payment-events \\
  --starting-position LATEST \\
  --batch-size 100 \\
  --amazon-managed-kafka-event-source-config '{ConsumerGroupId=fraud-scoring-cg}'

# Lambda role needs: dynamodb:PutItem, sqs:ReceiveMessage/DeleteMessage, kafka:DescribeCluster,
# EC2 ENI permissions for VPC-attached MSK access`,
    verify: `# Sync invoke (test payload)
aws lambda invoke \\
  --function-name payment-authorize \\
  --qualifier live \\
  --payload '{"headers":{"idempotency-key":"test-001"},"body":"{}"}' \\
  --cli-binary-format raw-in-base64-out /tmp/out.json && cat /tmp/out.json

# Provisioned concurrency utilization
aws lambda get-provisioned-concurrency-config \\
  --function-name payment-authorize --qualifier live

# Cold vs warm — check InitDuration in REPORT line (CloudWatch Logs)
aws logs filter-log-events \\
  --log-group-name /aws/lambda/payment-authorize \\
  --filter-pattern "Init Duration" --limit 5

# DLQ depth (failed async)
aws sqs get-queue-attributes \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/payment-settlement-dlq \\
  --attribute-names ApproximateNumberOfMessages

# Event source mapping state
aws lambda list-event-source-mappings --function-name fraud-scoring`,
    pitfalls:
      'New SDK client per invoke → slow + connection storm. No idempotency on async retries (SQS at-least-once). Provisioned concurrency on $LATEST instead of published alias/version. VPC-attached Lambda without enough ENI/IP capacity → throttling. 1024 MB default with heavy Spring — cold start 3–8s on Java; SnapStart only on Java 11/17 Corretto (not Spring Boot fat jar natively). Ignoring async destination DLQ.',
    production:
      'FinTech patterns: sync auth on API GW + Lambda + DynamoDB conditional write (idempotency key); settlement on SQS async worker with ReportBatchItemFailures; fraud scoring on MSK with reserved concurrency cap. ARM64 + slim handler (avoid full Spring in Lambda unless SnapStart/Java layer justified). Alias `live` + provisioned concurrency for p99 SLA; CloudWatch alarms on DLQ depth and concurrent execution throttles.',
    interview30s:
      'Sync invoke (API GW) waits for response; async (S3/SNS) retries then DLQ. Reuse clients outside handler. Provisioned concurrency kills cold starts. SQS/MSK event sources with batch + partial failure reporting.',
    interview2m:
      'Cold start = download + init + static blocks. Mitigate: arm64, minimal deps, provisioned concurrency, SnapStart (Corretto). API GW sync for payment authorize (<1s SLA); async SQS worker for settlement (retries + DLQ). MSK mapping for stream fraud rules — watch VPC ENI limits. Cost = invocations × duration × GB; provisioned concurrency is fixed $ even at zero traffic. Compare to ECS: Lambda wins for spiky/low-average; loses for sustained high RPS Java workloads.',
    traps:
      'Deploying full Spring Boot 150 MB fat jar to Lambda without measuring cold start — p99 explodes. No DLQ on async → silent data loss. "Lambda scales infinitely" — account concurrency default 1000, burst limits apply.',
  },
];
