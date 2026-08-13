import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {id:'s1',topic:'Senior',question:'What is an API Gateway?',answer30s:'Controlled entry between clients and services for API policy: route, security, traffic, obs.',answer2m:'Contrast without-gateway chaos.',followUps:['Responsibilities list?']},
  {id:'s2',topic:'Senior',question:'Gateway vs load balancer?',answer30s:'LB distributes connections; GW manages API concerns (auth, RL, versioning).',answer2m:'Memory trick WHERE vs ALLOWED.',followUps:['Typical layering?']},
  {id:'s3',topic:'Senior',question:'Gateway vs service mesh?',answer30s:'GW north-south; mesh east-west.',answer2m:'Istio/Envoy examples.',followUps:['Double retry risk?']},
  {id:'s4',topic:'Senior',question:'Spring Cloud Gateway route match?',answer30s:'Predicates (Path/Method/Header/Host) select; filters mutate.',answer2m:'YAML example.',followUps:['GlobalFilter?']},
  {id:'s5',topic:'Senior',question:'Where validate JWT?',answer30s:'Gateway first boundary; services still authorize sensitive ops.',answer2m:'Defense in depth.',followUps:['IdP outage?'],trick:'Gateway-only is always enough.'},
  {id:'s6',topic:'Senior',question:'Token bucket?',answer30s:'Refill tokens; burst up to capacity; else 429.',answer2m:'vs fixed window.',followUps:['Distributed RL?']},
  {id:'s7',topic:'Senior',question:'Why gateway retries dangerous?',answer30s:'Amplify load; duplicate non-idempotent payments.',answer2m:'Bounded+jitter+keys.',followUps:['Idempotency-Key?']},
  {id:'s8',topic:'Senior',question:'504 troubleshooting?',answer30s:'Timeout budget; trace downstream; often DB/service not GW bug.',answer2m:'Status table.',followUps:['502 vs 503?']},
  {id:'s9',topic:'Senior',question:'Gateway instance crash?',answer30s:'LB health removes it; others serve; scale new; keep stateless.',answer2m:'Readiness vs liveness.',followUps:['Draining?']},
  {id:'s10',topic:'Senior',question:'CORS failure real?',answer30s:'Check Network status—backend 500 can surface as CORS.',answer2m:'OPTIONS policy.',followUps:['Credentials?']},
];

export const ARCHITECT: InterviewQ[] = [
  {id:'a1',topic:'Architect',question:'Design gateway for 100k RPS',answer30s:'N gateways HA, distributed RL, backend capacity plan, shed, observe.',answer2m:'GW capacity ≠ backend capacity.',followUps:['Bottleneck prevention?']},
  {id:'a2',topic:'Architect',question:'Multi-region API Gateway',answer30s:'Route53 health, dual regional GW+backends, data consistency plan.',answer2m:'Active-active hard.',followUps:['What GW alone does not give?']},
  {id:'a3',topic:'Architect',question:'GW vs ALB vs Mesh together?',answer30s:'Edge policy → distribute → sidecars for S2S.',answer2m:'Banking diagram.',followUps:['Skip mesh when?']},
  {id:'a4',topic:'Architect',question:'IdP down — what happens?',answer30s:'Fail closed for new auth; JWKS cache for still-valid tokens; no auth bypass.',answer2m:'Security tradeoff.',followUps:['Cached keys risk?']},
  {id:'a5',topic:'Architect',question:'Safe payment retries via gateway?',answer30s:'Prefer no GW retry; client/service with Idempotency-Key.',answer2m:'Store semantics.',followUps:['Who owns retry?']},
  {id:'a6',topic:'Architect',question:'Tenant throttling design?',answer30s:'Tenant key → Redis/AWS usage plan; noisy neighbor isolation.',answer2m:'Fairness metrics.',followUps:['Cardinality?']},
  {id:'a7',topic:'Architect',question:'Zero-downtime gateway deploy?',answer30s:'Canary routes/stages, health gates, auto rollback, config GitOps.',answer2m:'Blue/green.',followUps:['Bad route 404 spike?']},
  {id:'a8',topic:'Architect',question:'When NOT to use a gateway?',answer30s:'Internal-only service calls; ultra-low latency east-west; simple monolith public LB.',answer2m:'Cost/latency.',followUps:['Every MS call through GW?']},
  {id:'a9',topic:'Architect',question:'State that must not live in GW instances?',answer30s:'Sessions, RL counters, auth decisions needing durability — externalize.',answer2m:'Crash story.',followUps:['Sticky sessions?']},
  {id:'a10',topic:'Architect',question:'Scale GW when backend saturated?',answer30s:'Do not — RL/shed first; scale backend; GW scale alone worsens.',answer2m:'50k vs 10k example.',followUps:['Load shedding?']},
];

export const RAPID_QS = [
  'HTTP API vs REST API AWS?',
  'WebSocket API use case?',
  'Predicate vs filter?',
  'Propagate vs mint trace IDs?',
  'WAF placement?',
  'Usage plan meaning?',
  'VPC link?',
  'Canary 90/10 action on bad V2?',
  'BFF partial failure?',
  'Throttle vs rate limit?',
  'Private API?',
  'Stage rollback?',
  'Connection draining?',
  'Why not cache POST /payments?',
  'North-south vs east-west?',
];

export const RAPID: InterviewQ[] = RAPID_QS.map((q, i) => ({
  id: `r${i + 1}`,
  topic: 'Rapid',
  question: q,
  answer30s: 'See cheat sheet / topic card.',
  answer2m: 'Tie to payment whiteboard.',
  followUps: ['Production pitfall?'],
}));

export const ALL = [...SENIOR, ...ARCHITECT, ...RAPID];
