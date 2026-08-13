export const LB_VS_GW = [
  {f:'Traffic distribution',lb:'Core',gw:'Sometimes'},
  {f:'API routing',lb:'Basic',gw:'Advanced'},
  {f:'Authentication / JWT',lb:'Limited',gw:'Strong / common'},
  {f:'Rate limiting / API keys',lb:'Limited',gw:'Core'},
  {f:'Transform / versioning / CORS',lb:'Limited',gw:'Yes'},
  {f:'Health checks',lb:'Core',gw:'Integration-dependent'},
  {f:'Primary job',lb:'Distribute',gw:'API policy & control'},
  {f:'Typical cost',lb:'Lower',gw:'Higher'},
];

export const STATUS = [
  {c:'401',a:'Auth',i:'Token / authorizer'},
  {c:'403',a:'AuthZ / WAF',i:'Policy'},
  {c:'404',a:'Routing',i:'Route / stage'},
  {c:'429',a:'Throttle',i:'Quota / spike / bots'},
  {c:'502',a:'Integration',i:'Backend connect'},
  {c:'503',a:'Availability',i:'Healthy targets'},
  {c:'504',a:'Timeout',i:'Downstream latency'},
];

export const CHEAT: [string, string][] = [
  ['API Gateway', 'Controlled client entry + API policy'],
  ['Load Balancer', 'Where should traffic go?'],
  ['Service Mesh', 'East-west service traffic'],
  ['WAF', 'Edge exploit filtering'],
  ['Rate limit', 'Control RPS / tenant quotas'],
  ['Idempotency', 'Safe money retries'],
  ['HA', 'N≥2 stateless + external state'],
  ['504', 'Often backend — prove with traces'],
];

export const REMEMBER: [string, string][] = [
  ['GW', 'CONTROL'],
  ['LB', 'DISTRIBUTE'],
  ['Service', 'BUSINESS'],
  ['DB', 'DATA'],
  ['Mesh', 'S2S'],
  ['WAF', 'EDGE SECURITY'],
];

export const DECISION = [
  {q:'Need JWT/rate-limit/versioning at edge?',yes:'API Gateway',no:'LB may suffice'},
  {q:'Service-to-service mTLS/retries?',yes:'Mesh / app resilience',no:'Keep east-west simple'},
  {q:'POST payment timeout?',yes:'Idempotency-Key; careful retry',no:'Bounded GET retry OK'},
  {q:'429 rising?',yes:'Quota/spike/bots — not "just scale GW"',no:'Check 5xx path'},
  {q:'Bad route deploy?',yes:'Rollback config/canary',no:'Deep backend hunt first'},
];

export const SIXTY =
  'An API Gateway is the controlled entry for client-to-service traffic. It handles routing, authn/authz, throttling, TLS, observability, and sometimes transform/aggregation. Run it redundantly and stateless, keep timeouts/retries/idempotency explicit, and remember LB distributes while mesh covers east-west.';

export const FIVE_MIN =
  'Whiteboard CloudFront→WAF→API Gateway→ALB→services. Compare GW vs LB vs mesh. Show Spring Cloud Gateway predicates/filters or AWS HTTP/REST/WS. Cover JWT at edge + defense in depth, Redis/AWS distributed rate limits, HA with readiness, canary/rollback, and 429/502/503/504 trees. Payments need Idempotency-Key; gateway often reports downstream pain—prove with traces.';
