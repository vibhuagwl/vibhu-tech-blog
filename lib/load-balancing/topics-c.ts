import type {LbTopic} from './types';

export const TOPICS_C: LbTopic[] = [
  {
    id: 'spring',
    title: 'Spring Cloud LoadBalancer (Client-Side)',
    badge: 'Spring',
    problem: 'Service A must call payment-service across multiple instances.',
    whenToUse: 'Service-to-service with discovery (Eureka/Consul/K8s).',
    whenAvoid: 'Replacing edge ALB for public internet traffic.',
    mermaid: `flowchart TB
  A[Service A] --> LB[Spring Cloud LoadBalancer]
  LB --> D[Service Discovery]
  D --> P1[payment-1]
  D --> P2[payment-2]
  D --> P3[payment-3]`,
    code: `@Configuration
public class Clients {
  @Bean
  @LoadBalanced
  RestClient.Builder restClientBuilder() {
    return RestClient.builder();
  }
}

// Usage:
restClientBuilder.build()
  .get()
  .uri("http://payment-service/payments/{id}", id)
  .retrieve()
  .body(Payment.class);
// Logical name → discovery → choose instance (RR by default)`,
    failure: 'No discovery → unknown host; calling IP bypasses client LB.',
    production: 'Combine with retries carefully; prefer openapi + resilience.',
    interview30s: 'Client-side LB picks an instance after discovery; server-side LB sits at the edge.',
    followUp: 'Spring Cloud LoadBalancer vs Netflix Ribbon?',
    tradeoff: 'App-owned balancing vs infra-owned ALB.',
    memoryTrick: 'Client-side = the caller chooses the teller.',
  },
  {
    id: 'aws-alb',
    title: 'AWS ALB (Application Load Balancer)',
    badge: 'AWS',
    problem: 'HTTP microservices need path-based routing and health checks.',
    whenToUse: 'HTTP/HTTPS Spring Boot, ECS/EKS, host/path rules.',
    whenAvoid: 'Raw TCP/UDP ultra-low latency — use NLB.',
    mermaid: `flowchart TB
  NET[Internet] --> ALB
  ALB --> TG1[TG payments]
  ALB --> TG2[TG users]
  TG1 --> E1[EC2/ECS]
  TG1 --> E2
  TG2 --> E3`,
    code: `# Conceptual ALB rules
# Listener 443
# IF path is /api/payments/* → forward target-group-payments
# IF path is /api/users/*    → forward target-group-users
# Health check: GET /actuator/health/readiness → 200

# Terraform-ish sketch
# aws_lb_listener_rule { path_pattern = ["/api/payments/*"] }`,
    failure: 'Wrong TG health path → all unhealthy → 503.',
    production: 'Multi-AZ ALB; ACM certs; access logs to S3; WAF association.',
    interview30s: 'ALB is L7: listeners, rules, target groups, health checks.',
    followUp: 'ALB vs API Gateway for auth?',
    tradeoff: 'HTTP smarts vs L4 raw speed.',
    memoryTrick: 'ALB = HTTP traffic director.',
  },
  {
    id: 'aws-nlb',
    title: 'AWS NLB (Network Load Balancer)',
    badge: 'AWS',
    problem: 'Need static IPs / TCP passthrough / extreme PPS.',
    whenToUse: 'TCP/UDP, gRPC sometimes, private link, static IP.',
    whenAvoid: 'Path-based HTTP routing — that is ALB.',
    mermaid: `flowchart LR
  C[Client] -->|TCP| NLB --> T1[Target]
  NLB --> T2`,
    code: `// NLB preserves source IP (with caveats) and works at L4
// No /payments path rules
// Cross-zone load balancing setting matters for evenness
// Often fronted for TLS pass-through or TLS at target`,
    failure: 'Expecting host/header routing on NLB.',
    production: 'NLB + ALB sandwich patterns exist; know why before nesting.',
    interview30s: 'NLB is L4 high-performance connection balancer with static IP options.',
    followUp: 'When put NLB in front of ALB?',
    tradeoff: 'Speed/static IP vs HTTP features.',
    memoryTrick: 'NLB = firehose for TCP.',
  },
  {
    id: 'alb-vs-nlb',
    title: 'ALB vs NLB Cheat Comparison',
    badge: 'AWS',
    problem: 'Pick the right AWS LB in an interview design.',
    whenToUse: 'Default ALB for Spring HTTP; NLB for TCP/static IP.',
    whenAvoid: 'One-size-fits-all.',
    mermaid: `flowchart TB
  ELB[AWS ELB] --> ALB[ALB L7]
  ELB --> NLB[NLB L4]
  ELB --> GWLB[GWLB appliances]`,
    code: `| Feature | ALB | NLB |
| HTTP path/host | Yes | No |
| UDP | No | Yes |
| Static IP | Not primary | Yes |
| Best for | Microservices HTTP | TCP/UDP/perf |`,
    failure: 'Using NLB then reinventing path routing in nginx on every node unnecessarily.',
    production: 'Document listener ports, TG health, AZ strategy.',
    interview30s: 'ALB understands HTTP; NLB understands connections.',
    followUp: 'GWLB role?',
    tradeoff: 'Features vs packets/sec.',
    memoryTrick: 'A=Application HTTP; N=Network TCP.',
  },
  {
    id: 'api-gw',
    title: 'API Gateway vs Load Balancer',
    badge: 'Critical',
    problem: 'Candidates conflate API management with traffic distribution.',
    whenToUse: 'Use both: Gateway for governance, LB for instance distribution.',
    whenAvoid: 'Saying API GW always replaces ALB.',
    mermaid: `flowchart TB
  C[Client] --> GW[API Gateway]
  GW --> AUTH[Auth]
  GW --> RL[Rate limit]
  GW --> ALB
  ALB --> S1[Svc]
  ALB --> S2`,
    code: `// Load Balancer primary job: distribute to healthy instances
// API Gateway primary job: manage APIs (authz, quotas, versions, transform)

// Payment edge:
// CloudFront → WAF → API Gateway → ALB → Payment ECS tasks

// Can GW route? Yes.
// Does that delete need for ALB target health/distribution? Often NO at scale.`,
    failure: 'Only GW, no instance LB → awkward scaling of many tasks.',
    production: 'Clear RACI: GW=product API; ALB=infra traffic.',
    interview30s: 'Gateway governs APIs; load balancer spreads traffic across instances.',
    followUp: 'AWS API Gateway + VPC link + ALB pattern?',
    tradeoff: 'Latency hops vs security/governance.',
    memoryTrick: 'Gateway = product desk; LB = floor managers assigning tellers.',
  },
  {
    id: 'deploy',
    title: 'Zero-Downtime · Blue/Green · Canary · Rolling',
    badge: 'Deploy',
    problem: 'Ship payment-service without dropping traffic.',
    whenToUse: 'Weighted TGs / canary for risk; blue/green for instant switch.',
    whenAvoid: 'Canary without metrics/abort.',
    mermaid: `flowchart LR
  V1[V1 100%] --> V2[V1 90% / V2 10%]
  V2 --> V3[50/50] --> V4[V2 100%]`,
    code: `// Canary on ALB weighted target groups
// Step: 100/0 → 90/10 → 50/50 → 0/100
// Abort if 5xx or latency SLO breaches

// Rolling ECS/K8s: surge + readiness
// Blue/green: two environments, flip listener weight/DNS`,
    failure: 'Flip 100% with failing readiness → outage.',
    production: 'Automate abort; keep drain; DB migrations backward compatible.',
    interview30s: 'Shift traffic gradually with health + metrics gates.',
    followUp: 'How handle breaking schema?',
    tradeoff: 'Speed vs blast radius.',
    memoryTrick: 'Canary = one bird first; blue/green = two full stages.',
  },
  {
    id: 'security',
    title: 'WAF · Private Subnets · Forwarded Headers',
    badge: 'Security',
    problem: 'Exposing Spring Boot directly to the internet.',
    whenToUse: 'WAF→ALB→private apps; trust LB hop only.',
    whenAvoid: 'Trusting raw X-Forwarded-For from the world.',
    mermaid: `flowchart TB
  NET[Internet] --> WAF --> ALB --> PRIV[Private Spring Boot]`,
    code: `server:
  forward-headers-strategy: framework

// Security group: only ALB SG → app port 8080
// Do not publish app SG to 0.0.0.0/0
// WAF rules: SQLi/XSS/rate for public APIs`,
    failure: 'App trusts client-supplied XFF → IP allowlists bypassed.',
    production: 'RemoteIpValve / ForwardedHeaderFilter with known proxies.',
    interview30s: 'Put apps private; terminate at ALB; WAF in front; sanitize forwarded headers.',
    followUp: 'mTLS between ALB and app?',
    tradeoff: 'Defense in depth vs complexity.',
    memoryTrick: 'Public door = WAF/ALB; vault = private subnet.',
  },
  {
    id: 'observability',
    title: 'Observability',
    badge: 'Ops',
    problem: '503s and you cannot tell if TG unhealthy or app bug.',
    whenToUse: 'Always monitor LB + app RED metrics.',
    whenAvoid: 'Only app logs without target health.',
    mermaid: `flowchart LR
  ALB --> M[Metrics]
  M --> R[Request count]
  M --> L[Latency]
  M --> E[5xx]
  M --> H[Healthy hosts]`,
    code: `// CloudWatch: HealthyHostCount, HTTPCode_Target_5XX_Count, TargetResponseTime
// App: Micrometer + /actuator/prometheus
// Alert: HealthyHostCount < 2 OR 5xx rate > 1%`,
    failure: 'No access logs → cannot debug rule mismatches.',
    production: 'ALB access logs + tracing baggage across GW/ALB/app.',
    interview30s: 'Watch healthy hosts, latency, 4xx/5xx, and distribution skew.',
    followUp: 'How detect sticky hotspot?',
    tradeoff: 'Log volume vs forensics.',
    memoryTrick: 'If hosts look healthy but 5xx spike → app bug; if hosts=0 → LB/health.',
  },
  {
    id: 'kafka',
    title: 'HTTP LB vs Kafka Consumer Groups',
    badge: 'Distinction',
    problem: 'Interview trap: putting ALB in front of Kafka consumers.',
    whenToUse: 'HTTP APIs use LB; Kafka uses partition assignment.',
    whenAvoid: 'HTTP-load-balancing Kafka poll loops.',
    mermaid: `flowchart TB
  subgraph HTTP
    ALB --> S1
    ALB --> S2
  end
  subgraph KAFKA
    P0[Partition0] --> C1
    P1[Partition1] --> C2
    P2[Partition2] --> C3
  end`,
    code: `// Kafka consumer group = cooperative ownership of partitions
// Not request-round-robin through ALB
// Producers talk to bootstrap brokers; consumers rebalance on membership`,
    failure: 'Designing payment events with ALB to consumers.',
    production: 'Separate edge HTTP scaling from event partition scaling.',
    interview30s: 'ALB distributes requests; Kafka distributes partitions to consumers.',
    followUp: 'How scale Kafka consumers?',
    tradeoff: 'Different scaling levers entirely.',
    memoryTrick: 'ALB shares requests; Kafka shares partitions.',
  },
];
