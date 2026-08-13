import type {InterviewQ} from './types';

export const BASIC: InterviewQ[] = [
  {id:'b1',topic:'Basic',question:'Why do we need a load balancer?',answer30s:'Spread traffic across healthy instances so one pod is not a bottleneck and failures are isolated.',answer2m:'Show single App-1 overload → LB → App-1..N with health.',followUps:['Does LB scale the database?']},
  {id:'b2',topic:'Basic',question:'What happens if one instance crashes?',answer30s:'Health checks fail; LB removes it; traffic goes to remaining healthy targets.',answer2m:'Mention draining and multi-AZ.',followUps:['What if all unhealthy?']},
  {id:'b3',topic:'Basic',question:'Round Robin vs Least Connections?',answer30s:'RR cycles equally; least-conn prefers fewest in-flight — better for uneven duration.',answer2m:'Payment callbacks example.',followUps:['When is RR enough?']},
  {id:'b4',topic:'Basic',question:'L4 vs L7?',answer30s:'L4=TCP/UDP; L7=HTTP aware routing.',answer2m:'ALB vs NLB mapping.',followUps:['Can L4 do path routing?'],trick:'NLB path rules.'},
  {id:'b5',topic:'Basic',question:'What is a health check?',answer30s:'Periodic probe; unhealthy targets leave rotation.',answer2m:'Readiness vs liveness.',followUps:['Lying /health?']},
];

export const SENIOR: InterviewQ[] = [
  {id:'s1',topic:'Senior',question:'ALB vs NLB?',answer30s:'ALB L7 HTTP features; NLB L4 performance/static IP/UDP.',answer2m:'Table path routing, UDP, static IP.',followUps:['GWLB?']},
  {id:'s2',topic:'Senior',question:'Sticky sessions — why avoid?',answer30s:'Crash loses sessions; hotspots; prefer shared session/stateless.',answer2m:'Spring Session Redis.',followUps:['When sticky unavoidable?']},
  {id:'s3',topic:'Senior',question:'Liveness vs readiness?',answer30s:'Liveness=restart if dead; readiness=admit traffic only when ready.',answer2m:'DB down should fail readiness for DB-dependent APIs.',followUps:['Startup probe?']},
  {id:'s4',topic:'Senior',question:'API Gateway vs Load Balancer?',answer30s:'GW governs APIs; LB distributes instances.',answer2m:'Often CloudFront→WAF→GW→ALB→apps.',followUps:['Can GW replace ALB?'],trick:'They are the same.'},
  {id:'s5',topic:'Senior',question:'Retries on payment POST?',answer30s:'Only with idempotency keys; otherwise double charge.',answer2m:'Idempotency store + exactly-once business effect.',followUps:['Where enforce key?']},
  {id:'s6',topic:'Senior',question:'Zero-downtime deploy with ALB?',answer30s:'New healthy targets; weighted shift; drain old; abort on SLO breach.',answer2m:'Canary vs blue/green.',followUps:['Deregistration delay?']},
];

export const ARCHITECT: InterviewQ[] = [
  {id:'a1',topic:'Architect',question:'Design for 1M req/s HTTP payments edge?',answer30s:'CDN/WAF, horizontal ALB, many AZ tasks, cache, DB not on ALB, backpressure.',answer2m:'Separate read/write; async where possible.',followUps:['Bottleneck after apps scale?']},
  {id:'a2',topic:'Architect',question:'Global load balancing?',answer30s:'DNS/Geo/Anycast + regional stacks; avoid cross-region sync locks on path.',answer2m:'Failover RPO/RTO.',followUps:['Sticky across regions?']},
  {id:'a3',topic:'Architect',question:'Slow instance still in RR?',answer30s:'RR ignores latency; use least-conn/outlier ejection/response-time algorithms.',answer2m:'Observability to detect.',followUps:['Envoy outlier detection?']},
  {id:'a4',topic:'Architect',question:'LB itself fails?',answer30s:'Managed multi-AZ ALB/NLB; dual LB; DNS failover; no single box.',answer2m:'Control plane vs data plane.',followUps:['AZ outage story?']},
  {id:'a5',topic:'Architect',question:'Where put auth vs rate limit?',answer30s:'Usually API GW/WAF edge; LB focuses on distribution; defense in depth in app.',answer2m:'JWT validation location tradeoffs.',followUps:['mTLS service mesh?']},
  {id:'a6',topic:'Architect',question:'WebSockets through ALB?',answer30s:'Long-lived connections; idle timeouts; affinity sometimes; reconnect strategy.',answer2m:'Compare NLB pass-through.',followUps:['Sticky required?']},
  {id:'a7',topic:'Architect',question:'Why Kafka ≠ HTTP LB?',answer30s:'Consumers own partitions via group protocol, not request RR.',answer2m:'Scale by partitions/consumers.',followUps:['Connect HTTP to Kafka how?']},
];

function rapid(): InterviewQ[] {
  const qs = [
    'Why LB?','One instance crash?','RR vs least-conn?','L4 vs L7?','ALB vs NLB?',
    'Sticky downside?','Health check?','Readiness vs liveness?','Weighted use?','Consistent hash?',
    'IP hash NAT issue?','TLS terminate where?','X-Forwarded-Proto?','Connection draining?',
    'Canary steps?','Blue-green?','Rolling?','API GW job?','Can GW replace ALB?',
    'Idempotent retry?','WAF placement?','Target group?','Listener rule?','Static IP need?',
    'Spring @LoadBalanced?','Client vs server LB?','DB scaling myth?','WebSocket timeout?',
    'Kafka partitions?','HealthyHostCount alert?','503 all unhealthy?','Cross-zone LB?',
  ];
  return qs.map((q,i)=>({
    id:`r${i+1}`,topic:'Rapid',question:q,
    answer30s:'Mechanism → failure → AWS/Spring choice with payment example.',
    answer2m:'Tie to health, algorithm, and API GW separation.',
    followUps:['What breaks at 10× traffic?'],
  }));
}

export const RAPID = rapid();
export const ALL = [...BASIC, ...SENIOR, ...ARCHITECT, ...RAPID];
