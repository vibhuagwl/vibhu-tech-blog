import type {AwsTopic} from './types';

export const TOPICS_NETWORK: AwsTopic[] = [
  {
    id: 'vpc',
    title: 'VPC Deep Dive — Subnets, Routing, Security',
    badge: 'Network',
    category: 'Network',
    askLevel: '⭐ MOST ASKED',
    what: 'VPC is your isolated network boundary in AWS. Public subnets have a route to an Internet Gateway (IGW); private subnets do not. Private workloads reach the internet via NAT Gateway (outbound only). Security Groups are stateful firewalls on ENIs; NACLs are stateless subnet gates. VPC endpoints keep AWS API traffic inside AWS without NAT. Peering connects two VPCs; Transit Gateway (TGW) is the hub for many VPCs/on-prem.',
    mermaid: `flowchart TB
  subgraph Internet
    Users[Internet Users]
  end

  subgraph VPC["VPC 10.0.0.0/16"]
    IGW[Internet Gateway]

    subgraph Public["Public Subnet 10.0.1.0/24 — AZ-a"]
      ALB[Application Load Balancer]
      NAT[NAT Gateway + EIP]
    end

    subgraph Private["Private Subnet 10.0.10.0/24 — AZ-a"]
      EC2[EC2 App Tier]
      RDS[(RDS PostgreSQL)]
    end

    subgraph Endpoint["Gateway Endpoint"]
      S3EP[S3 / DynamoDB]
    end

    RTpub[Public RT: 0.0.0.0/0 → IGW]
    RTpriv[Private RT: 0.0.0.0/0 → NAT]
  end

  Users -->|HTTPS :443| IGW
  IGW --> ALB
  ALB -->|SG: allow 8080 from ALB| EC2
  EC2 -->|SG: allow 5432 from EC2| RDS
  EC2 -->|outbound via NAT| NAT
  NAT --> IGW
  EC2 -.->|no NAT needed| S3EP`,
    code: `# ═══════════════════════════════════════════════════════════════
# WHY private subnet needs NAT (not IGW)
# ═══════════════════════════════════════════════════════════════
# • IGW route makes resources PUBLIC — inbound from internet possible
# • Private EC2 has no public IP → return packets from internet fail
# • NAT Gateway: outbound SNAT only — EC2 pulls Docker images, calls APIs
# • RDS has NO route to IGW/NAT — only accepts connections from app SG

# ═══════════════════════════════════════════════════════════════
# Terraform — production 3-tier VPC (2 AZs)
# ═══════════════════════════════════════════════════════════════
variable "region" { default = "us-east-1" }
variable "vpc_cidr" { default = "10.0.0.0/16" }

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true   # required for RDS hostname resolution
  enable_dns_support   = true
  tags = { Name = "prod-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}

# ── Public subnets (ALB + NAT live here) ──
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)       # 10.0.0.0/24, 10.0.1.0/24
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true   # only for bastion/NAT — NOT app tier
  tags = { Name = "public-\${count.index}" }
}

# ── Private subnets (EC2 + RDS) ──
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)        # 10.0.10.0/24, 10.0.11.0/24
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = { Name = "private-\${count.index}" }
}

# NAT per AZ for HA (avoid cross-AZ NAT hairpin = latency + cost)
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"
}
resource "aws_nat_gateway" "nat" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
}

# Route tables — THE interview diagram labels
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id    # label: Public RT → IGW
  }
}
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[count.index].id   # label: Private RT → NAT
  }
}

# ── Security Group (STATEFUL) vs NACL (STATELESS) ──
resource "aws_security_group" "alb" {
  name   = "alb-sg"
  vpc_id = aws_vpc.main.id
  ingress { from_port = 443 to_port = 443 protocol = "tcp" cidr_blocks = ["0.0.0.0/0"] }
  egress  { from_port = 0  to_port = 0  protocol = "-1"  cidr_blocks = ["0.0.0.0/0"] }
  # STATEFUL: return traffic auto-allowed if ingress permitted
}

resource "aws_security_group" "app" {
  name   = "app-sg"
  vpc_id = aws_vpc.main.id
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]   # reference SG, not CIDR
  }
  egress { from_port = 0 to_port = 0 protocol = "-1" cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_security_group" "rds" {
  name   = "rds-sg"
  vpc_id = aws_vpc.main.id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]    # WHY RDS not public: no 0.0.0.0/0 here
  }
  # RDS in private subnet + this SG = defense in depth
}

# NACL example — subnet-level, stateless (must allow BOTH directions)
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id
  # Ephemeral return ports 1024-65535 must be explicitly allowed on NACL
  ingress { rule_number = 100 protocol = "tcp" action = "allow" cidr_block = "10.0.0.0/16" from_port = 1024 to_port = 65535 }
  egress  { rule_number = 100 protocol = "tcp" action = "allow" cidr_block = "0.0.0.0/0"     from_port = 443  to_port = 443 }
}

# ── VPC Endpoint vs NAT ──
# Gateway endpoint (S3/DynamoDB): FREE, route table entry, no NAT charge
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.\${var.region}.s3"
  route_table_ids = aws_route_table.private[*].id
}
# Interface endpoint (Secrets Manager, SQS): ENI per AZ, ~\$0.01/hr + data — still cheaper than NAT for AWS API calls

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.\${var.region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.app.id]
  private_dns_enabled = true
}

# ── VPC Peering vs Transit Gateway ──
# Peering: 1:1, no transitive routing (A↔B and B↔C does NOT let A reach C)
resource "aws_vpc_peering_connection" "shared_services" {
  vpc_id      = aws_vpc.main.id
  peer_vpc_id = var.shared_services_vpc_id
  auto_accept = false
}
# TGW: hub-and-spoke, transitive, on-prem via Direct Connect/VPN attachment
resource "aws_ec2_transit_gateway" "hub" {
  description = "org hub — replaces N×N peering mesh"
}

# ═══════════════════════════════════════════════════════════════
# AWS CLI — verify routing & security (interview lab)
# ═══════════════════════════════════════════════════════════════
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=\${VPC_ID}" \\
  --query 'RouteTables[*].{RT:RouteTableId,Routes:Routes}' --output table

aws ec2 describe-security-groups --group-ids \${APP_SG} \\
  --query 'SecurityGroups[0].{Ingress:IpPermissions,Egress:IpPermissionsEgress}'

# Prove RDS is NOT publicly accessible
aws rds describe-db-instances --db-instance-identifier prod-db \\
  --query 'DBInstances[0].{Public:PubliclyAccessible,SubnetGroup:DBSubnetGroup.VpcId}'

# Test NAT path from private instance (SSM Session Manager — no bastion needed)
aws ssm start-session --target \${EC2_INSTANCE_ID}
curl -s https://checkip.amazonaws.com   # returns NAT EIP, not instance IP`,
    verify: `# From private EC2 via SSM:
curl -s https://checkip.amazonaws.com          # → NAT Gateway EIP
aws s3 ls s3://my-bucket/                      # → via S3 gateway endpoint (no NAT)
nc -zv prod-db.xxxxx.us-east-1.rds.amazonaws.com 5432  # → succeeds from app SG only
# From internet:
nc -zv <rds-endpoint> 5432                     # → TIMEOUT (private subnet + SG)`,
    pitfalls: 'Single NAT Gateway in one AZ — AZ failure kills all private outbound. Putting app tier in public subnet with 0.0.0.0/0 SG. NACL blocking ephemeral return ports (stateless). VPC peering overlapping CIDRs. Interface endpoint without private DNS — apps still hit public endpoints via NAT.',
    production: 'NAT per AZ; app/RDS in private subnets only; SG reference other SGs not CIDRs; gateway endpoints for S3/DynamoDB; interface endpoints for Secrets Manager/SQS/STS; TGW for multi-VPC; SSM Session Manager instead of bastion; flow logs to S3 for forensics.',
    interview30s: 'Public subnet routes to IGW — resources can be internet-reachable. Private subnet routes outbound via NAT — no inbound from internet. SG is stateful instance firewall; NACL is stateless subnet gate. RDS stays private: private subnet + SG allowing only app tier. Endpoints avoid NAT for AWS API traffic.',
    interview2m: 'Walk Internet → IGW → public ALB → private EC2 → RDS. Explain WHY private needs NAT: no public IP, but must pull images/patch. WHY RDS not public: attack surface, compliance, SG defense. SG vs NACL: stateful vs stateless, instance vs subnet, default allow egress on SG vs explicit rules on NACL. Endpoint vs NAT: S3 gateway endpoint is free and keeps traffic on AWS backbone; NAT charges per GB for same traffic. Peering is non-transitive; TGW scales hub-and-spoke.',
    traps: '"Private subnet means no internet" — false, NAT provides outbound-only internet. "Security Group denied so NACL must be the problem" — check both; SG is stateful, NACL needs return port rules. "VPC endpoint replaces NAT entirely" — only for supported AWS services; npm/Docker Hub still need NAT or egress-only solutions. "IGW on private subnet" — IGW is VPC-attached, not subnet; routing table decides public vs private behavior.',
  },
  {
    id: 'load-balancing',
    title: 'ALB vs NLB vs GWLB — Target Groups & Health',
    badge: 'Load Balancing',
    category: 'Network',
    askLevel: '🔥 SENIOR',
    what: 'ALB is Layer 7 HTTP/HTTPS — path/host/header routing, TLS termination, WebSockets. NLB is Layer 4 TCP/UDP — ultra-low latency, static IP, millions of RPS, preserves source IP. GWLB is for inline security appliances (firewalls, IDS). Target groups define backends; health checks determine routing. Sticky sessions (ALB cookie) pin users to one target. TLS terminates at ALB with ACM cert — backends often speak HTTP on port 8080 inside VPC.',
    mermaid: `flowchart LR
  Client[Client Browser]
  R53[Route 53<br/>api.company.com]
  ALB[ALB :443<br/>TLS termination]
  TG1[Target Group<br/>/orders/*]
  TG2[Target Group<br/>/users/*]
  O1[orders-svc :8080]
  O2[orders-svc :8080]
  U1[users-svc :8080]
  U2[users-svc :8080]

  Client -->|HTTPS| R53
  R53 --> ALB
  ALB -->|path rule| TG1
  ALB -->|path rule| TG2
  TG1 --> O1
  TG1 --> O2
  TG2 --> U1
  TG2 --> U2`,
    code: `# ═══════════════════════════════════════════════════════════════
# ALB vs NLB vs GWLB — when to pick each
# ═══════════════════════════════════════════════════════════════
# ALB  — L7 HTTP/HTTPS, path/host routing, TLS offload, stickiness
# NLB  — L4 TCP/UDP, static IP/EIP, millions conn/sec, gRPC/TLS pass-through
# GWLB — L3/L4 GENEVE encapsulation to firewall/IDS appliances (inline inspection)

# ═══════════════════════════════════════════════════════════════
# Terraform — ALB with path routing, health checks, TLS, stickiness
# ═══════════════════════════════════════════════════════════════
resource "aws_lb" "api" {
  name               = "api-alb"
  internal           = false
  load_balancer_type = "application"   # ALB
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_acm_certificate" "api" {
  domain_name       = "api.company.com"
  validation_method = "DNS"
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.api.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.api.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.orders.arn
  }
}

# Path-based routing → microservices
resource "aws_lb_listener_rule" "users" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.users.arn
  }
  condition {
    path_pattern { values = ["/users/*"] }
  }
}

resource "aws_lb_target_group" "orders" {
  name     = "orders-tg"
  port     = 8080
  protocol = "HTTP"          # TLS terminated at ALB; backend is HTTP inside VPC
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    path                = "/actuator/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200"
  }

  stickiness {
    type            = "lb_cookie"    # AWSALB cookie — session affinity
    cookie_duration = 86400          # 1 day
    enabled         = true
  }
}

resource "aws_lb_target_group" "users" {
  name     = "users-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  health_check { path = "/health" matcher = "200" interval = 15 }
}

resource "aws_lb_target_group_attachment" "orders" {
  count            = length(var.orders_instance_ids)
  target_group_arn = aws_lb_target_group.orders.arn
  target_id        = var.orders_instance_ids[count.index]
  port             = 8080
}

# ═══════════════════════════════════════════════════════════════
# NLB — TCP pass-through, static IP, gRPC
# ═══════════════════════════════════════════════════════════════
resource "aws_lb" "nlb" {
  name               = "payments-nlb"
  load_balancer_type = "network"
  subnets            = aws_subnet.public[*].id
  # NLB preserves client source IP (no X-Forwarded-For needed)
}

resource "aws_lb_target_group" "grpc" {
  name        = "grpc-tg"
  port        = 50051
  protocol    = "TCP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"           # ECS/Fargate awsvpc mode

  health_check {
    protocol            = "HTTP"   # NLB can HTTP health-check TCP targets
    port                = "8081"
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

# ═══════════════════════════════════════════════════════════════
# GWLB — inline firewall inspection (security appliance vendors)
# ═══════════════════════════════════════════════════════════════
resource "aws_lb" "gwlb" {
  load_balancer_type = "gateway"
  name               = "security-gwlb"
  subnets            = aws_subnet.public[*].id
}
# Traffic flow: App → GWLB endpoint → firewall appliance → destination
# Use case: replace inline NAT instance with managed appliance scaling

# ═══════════════════════════════════════════════════════════════
# AWS CLI — health check debugging
# ═══════════════════════════════════════════════════════════════
aws elbv2 describe-target-health --target-group-arn \${ORDERS_TG_ARN}
# State: healthy | unhealthy | initial | draining

aws elbv2 describe-target-groups --names orders-tg \\
  --query 'TargetGroups[0].{HC:HealthCheckPath,Interval:HealthCheckIntervalSeconds,Matcher:Matcher.HttpCode}'

# Common unhealthy causes:
# 1. SG on EC2 doesn't allow ALB SG on port 8080
# 2. Health path returns 404 (wrong /actuator/health)
# 3. Target in wrong subnet (ALB can't reach private subnet without route)

# Sticky session header inspection
curl -v https://api.company.com/orders/1 2>&1 | grep -i set-cookie
# AWSALB=xxxx; Expires=...; Path=/`,
    verify: `aws elbv2 describe-target-health --target-group-arn \${TG_ARN}
# All targets: State=healthy

curl -I https://api.company.com/actuator/health
# HTTP/2 200 — TLS terminated at ALB

# Confirm backend sees HTTP (not HTTPS) if SSH/SSM to instance:
# tcpdump -i any port 8080 → plain HTTP from ALB node IP`,
    pitfalls: 'Health check path returns 401 — ALB marks target unhealthy. SG allows 443 but not 8080 from ALB SG. Sticky sessions break stateless autoscaling during deploys. NLB + TLS pass-through means cert management on every backend. Cross-zone ALB adds latency but improves distribution — costs extra.',
    production: 'ALB for HTTP microservices; NLB for gRPC/TCP/static IP; terminate TLS at ALB with ACM; HTTP backend in VPC is OK with SG isolation; health check lightweight /health endpoint; deregistration delay 30–300s for connection draining; stickiness only when session state is local (otherwise use Redis).',
    interview30s: 'ALB = L7, routes by path/host, terminates TLS, supports stickiness. NLB = L4 TCP/UDP, millions RPS, preserves client IP. GWLB = inline security appliances. Target groups hold backends; health checks remove unhealthy targets. TLS at ALB means backends run HTTP on 8080 inside private VPC.',
    interview2m: 'Client → Route53 → ALB:443 (ACM cert) → listener rules by path → target group → EC2:8080. Contrast ALB vs NLB: ALB inspects HTTP headers; NLB forwards TCP blindly — use for gRPC, gaming, extreme throughput. Health checks: ALB hits /actuator/health every 30s; 3 failures = unhealthy. Sticky sessions via AWSALB cookie — tradeoff: even load vs session state. TLS termination at ALB simplifies cert rotation (one ACM cert) but traffic is HTTP inside VPC — secure with SGs.',
    traps: '"ALB encrypts end-to-end" — TLS stops at ALB unless re-encrypt to backend (HTTPS target group). "NLB does path routing" — no, that is ALB. "Healthy target group means app works" — health check may hit /health while /payments is broken. "Enable stickiness for all APIs" — breaks horizontal scaling for stateless services.',
  },
  {
    id: 'route53',
    title: 'Route 53 — DNS, Alias Records & Routing Policies',
    badge: 'DNS',
    category: 'Network',
    askLevel: '🏆 STAFF',
    what: 'Route 53 is AWS managed DNS. Hosted zones hold records for a domain. Alias records map to AWS resources (ALB, CloudFront, S3) at the zone apex — free queries, automatic IP updates. CNAME only works for subdomains, not apex (example.com). Routing policies: simple (one record), weighted (canary %), latency (lowest RTT region), failover (active/passive), geolocation (compliance/data residency).',
    mermaid: `flowchart LR
  User[User]
  DNS[api.company.com]
  R53[Route 53 Hosted Zone<br/>company.com]
  ALB[ALB us-east-1]
  CF[CloudFront CDN]
  S3[S3 static site]

  User -->|resolver query| DNS
  DNS --> R53
  R53 -->|Alias A record| ALB
  R53 -.->|Alias| CF
  R53 -.->|Alias| S3`,
    code: `# ═══════════════════════════════════════════════════════════════
# Hosted zone + Alias vs CNAME
# ═══════════════════════════════════════════════════════════════
# ALIAS (Route 53 only):
#   • Works at ZONE APEX (company.com) — CNAME cannot
#   • Free queries to AWS targets (ALB, CF, S3, API GW)
#   • Auto-tracks target IP changes (ALB nodes rotate)
# CNAME:
#   • Subdomain only (www.company.com → external.host.com)
#   • Extra DNS lookup hop, standard query charges
#   • Cannot point apex domain

# ═══════════════════════════════════════════════════════════════
# Terraform — hosted zone + routing policies
# ═══════════════════════════════════════════════════════════════
resource "aws_route53_zone" "main" {
  name = "company.com"
}

# Alias A record → ALB (preferred over CNAME for AWS targets)
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.company.com"
  type    = "A"

  alias {
    name                   = aws_lb.api.dns_name          # xxx.elb.amazonaws.com
    zone_id                = aws_lb.api.zone_id            # ALB hosted zone ID
    evaluate_target_health = true                         # don't route to unhealthy ALB
  }
}

# Apex domain → CloudFront (Alias required — CNAME illegal at apex)
resource "aws_route53_record" "apex" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "company.com"
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

# ── WEIGHTED routing — canary 10% to new ALB ──
resource "aws_route53_record" "api_blue" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.company.com"
  type    = "A"
  set_identifier = "blue-v2"
  weighted_routing_policy { weight = 10 }
  alias {
    name                   = aws_lb.api_v2.dns_name
    zone_id                = aws_lb.api_v2.zone_id
    evaluate_target_health = true
  }
}
resource "aws_route53_record" "api_green" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.company.com"
  type    = "A"
  set_identifier = "green-v1"
  weighted_routing_policy { weight = 90 }
  alias {
    name                   = aws_lb.api.dns_name
    zone_id                = aws_lb.api.zone_id
    evaluate_target_health = true
  }
}

# ── LATENCY routing — route to nearest healthy region ──
resource "aws_route53_record" "api_us" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "global.company.com"
  type           = "A"
  set_identifier = "us-east-1"
  latency_routing_policy { region = "us-east-1" }
  alias { name = aws_lb.api_us.dns_name zone_id = aws_lb.api_us.zone_id evaluate_target_health = true }
}
resource "aws_route53_record" "api_eu" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "global.company.com"
  type           = "A"
  set_identifier = "eu-west-1"
  latency_routing_policy { region = "eu-west-1" }
  alias { name = aws_lb.api_eu.dns_name zone_id = aws_lb.api_eu.zone_id evaluate_target_health = true }
}

# ── FAILOVER routing — active/passive DR ──
resource "aws_route53_health_check" "primary" {
  fqdn              = "api.company.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/actuator/health"
  failure_threshold = 3
  request_interval  = 30
}

resource "aws_route53_record" "api_primary" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "api.company.com"
  type           = "A"
  set_identifier = "primary-us-east-1"
  failover_routing_policy { type = "PRIMARY" }
  health_check_id = aws_route53_health_check.primary.id
  alias { name = aws_lb.api.dns_name zone_id = aws_lb.api.zone_id evaluate_target_health = true }
}
resource "aws_route53_record" "api_secondary" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "api.company.com"
  type           = "A"
  set_identifier = "secondary-us-west-2"
  failover_routing_policy { type = "SECONDARY" }
  alias { name = aws_lb.api_dr.dns_name zone_id = aws_lb.api_dr.zone_id evaluate_target_health = true }
}

# ── GEOLOCATION routing — GDPR data residency ──
resource "aws_route53_record" "api_eu_geo" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "api.company.com"
  type           = "A"
  set_identifier = "EU-GDPR"
  geolocation_routing_policy { country = "DE" }
  alias { name = aws_lb.api_eu.dns_name zone_id = aws_lb.api_eu.zone_id evaluate_target_health = true }
}

# ═══════════════════════════════════════════════════════════════
# AWS CLI — inspect & test DNS
# ═══════════════════════════════════════════════════════════════
aws route53 list-hosted-zones --query 'HostedZones[*].{Name:Name,Id:Id,Private:Config.PrivateZone}'

aws route53 list-resource-record-sets --hosted-zone-id \${ZONE_ID} \\
  --query "ResourceRecordSets[?Name=='api.company.com.']"

# Test resolution (note: TTL caching affects failover speed)
dig api.company.com A +short
dig api.company.com A @ns-xxx.awsdns-xx.com   # query authoritative directly

# Weighted policy simulation — run multiple queries, count distribution
for i in \$(seq 1 20); do dig +short api.company.com; done | sort | uniq -c

# Health check status
aws route53 get-health-check-status --health-check-id \${HC_ID}`,
    verify: `dig api.company.com A +short
# Returns ALB node IPs (Alias resolves to A record IPs)

aws route53 test-dns-answer --hosted-zone-id \${ZONE_ID} --record-name api.company.com --record-type A
# RecordData → ALB DNS name → IPs

# Failover test: stop primary ALB targets → health check fails → secondary serves within ~60-90s (TTL + health interval)`,
    pitfalls: 'CNAME at zone apex — invalid DNS, use Alias. Weighted routing without unique set_identifier — Terraform/API error. Failover secondary never tested — DR surprise. Low TTL not set before migration — clients cache old IP for hours. Geolocation ≠ geoproximity (latter uses bias, not strict boundaries). Private hosted zone not linked to all VPCs — DNS fails from unlinked VPC.',
    production: 'Alias for all AWS targets; evaluate_target_health=true on ALB aliases; weighted for blue/green DNS cutover; latency for multi-region active-active; failover with health checks for DR; geolocation for compliance; lower TTL (60s) before migrations; private hosted zones associated with every VPC that needs internal DNS.',
    interview30s: 'Route 53 hosted zone holds DNS records. Alias maps to AWS resources at apex or subdomain — free, auto-updates ALB IPs. CNAME only for subdomains, extra lookup cost. Routing: simple (default), weighted (canary %), latency (nearest region), failover (active/passive + health check), geolocation (country rules).',
    interview2m: 'api.company.com → Route 53 hosted zone → Alias A record → ALB. Alias vs CNAME: Alias works at apex, no charge for AWS targets, tracks ALB IP rotation. CNAME for external targets only (e.g., www → marketing SaaS). Weighted: 10/90 split for canary — each record needs set_identifier. Latency: Route 53 measures client-to-region RTT, routes to lowest — great for global apps. Failover: PRIMARY + health check; SECONDARY idle until primary unhealthy — watch TTL for failover speed. Geolocation: route EU users to eu-west-1 for GDPR — distinct from latency (compliance vs performance).',
    traps: '"Route 53 load balances" — it returns DNS answers; ALB/NLB does connection-level LB. DNS weighted 50/50 means ~50% of clients per resolver cache, not per-request. "CNAME for company.com apex" — RFC violation; must use Alias. "Failover is instant" — health check interval (30s) + DNS TTL (default 300s) = minutes. "Latency routing picks closest ALB node" — it picks closest REGION record, not individual AZ.',
  },
];
