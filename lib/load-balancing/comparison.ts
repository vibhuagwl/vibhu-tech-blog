export const L4_L7 = [
  {feature:'OSI',l4:'4 Transport',l7:'7 Application'},
  {feature:'TCP/UDP',l4:'Yes',l7:'TCP underneath'},
  {feature:'HTTP aware',l4:'No',l7:'Yes'},
  {feature:'URL routing',l4:'No',l7:'Yes'},
  {feature:'Header/cookie',l4:'No',l7:'Yes'},
  {feature:'Perf',l4:'Very high',l7:'High'},
  {feature:'Intelligence',l4:'Low',l7:'High'},
];

export const ALB_NLB = [
  {feature:'OSI',alb:'L7',nlb:'L4'},
  {feature:'HTTP path/host',alb:'Yes',nlb:'No'},
  {feature:'UDP',alb:'No',nlb:'Yes'},
  {feature:'Static IP',alb:'Not primary',nlb:'Yes'},
  {feature:'Best for',alb:'HTTP microservices',nlb:'TCP/UDP/high PPS'},
];

export const GW_VS_LB = [
  {feature:'Main purpose',lb:'Traffic distribution',gw:'API management'},
  {feature:'Health checks',lb:'Core',gw:'Integrates'},
  {feature:'AuthN/AuthZ',lb:'Limited',gw:'Strong'},
  {feature:'Rate limit',lb:'Limited',gw:'Core'},
  {feature:'API versioning',lb:'Limited',gw:'Yes'},
  {feature:'Transform',lb:'Limited',gw:'Yes'},
  {feature:'Best for',lb:'Infra traffic',gw:'API governance'},
];

export const CHEAT: [string, string][] = [
  ['L4', 'TCP/UDP connections'],
  ['L7', 'HTTP path/host/header'],
  ['ALB', 'HTTP microservices'],
  ['NLB', 'TCP/UDP / static IP'],
  ['API GW', 'Auth, quotas, versions'],
  ['Round Robin', 'Equal spray'],
  ['Weighted', 'Canary / capacity'],
  ['Least Conn', 'Long requests'],
  ['IP Hash', 'Crude sticky'],
  ['Consistent Hash', 'Minimal remap'],
  ['Sticky', 'Prefer Redis session'],
  ['Readiness', 'May I take traffic'],
  ['Liveness', 'Am I alive'],
  ['Idempotency', 'Safe POST retries'],
];

export const REMEMBER: [string, string][] = [
  ['LB', 'Distribute + health + failover'],
  ['API GW', 'Govern APIs'],
  ['ALB ≠ API GW', 'Different jobs'],
  ['Stateless', 'Scale without sticky'],
  ['Canary', 'Shift weight slowly'],
  ['Kafka', 'Partitions ≠ HTTP LB'],
];

export const DECISION = [
  {q:'HTTP/HTTPS public APIs?',yes:'L7 / ALB (+ WAF)',no:'L4 / NLB if TCP/UDP'},
  {q:'Need API auth/quotas/versions?',yes:'API Gateway in front',no:'ALB may suffice at edge'},
  {q:'Service-to-service with discovery?',yes:'Spring Cloud LoadBalancer',no:'Direct URL / mesh'},
  {q:'Unequal capacity or canary?',yes:'Weighted routing',no:'Round robin'},
  {q:'Long-lived connections?',yes:'Least connections / careful sticky',no:'RR fine'},
  {q:'Session in memory?',yes:'Migrate to Redis; sticky temporary',no:'Stateless win'},
];
