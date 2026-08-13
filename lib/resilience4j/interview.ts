import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {id:'s1',topic:'Senior',question:'What is Resilience4j and why not custom retry?',answer30s:'Lightweight fault-tolerance library with tested CB/Retry/BH/RL/TL, metrics, Spring Boot integration — less buggy than ad-hoc wrappers.',answer2m:'Hystrix alternative; functional decorators; Micrometer.',followUps:['Modules list?']},
  {id:'s2',topic:'Senior',question:'Circuit breaker states?',answer30s:'CLOSED normal; OPEN fail-fast after threshold; HALF_OPEN probes then CLOSED or OPEN.',answer2m:'Draw state machine; waitDuration; permitted half-open calls.',followUps:['slowCallRate?']},
  {id:'s3',topic:'Senior',question:'Why minimumNumberOfCalls?',answer30s:'Avoid opening on tiny samples (2 fails of 2 = 100%).',answer2m:'Show 30/100 = 30% example.',followUps:['COUNT vs TIME window?']},
  {id:'s4',topic:'Senior',question:'Why is retry dangerous for payments?',answer30s:'Timeout may mean bank already charged — duplicate without idempotency.',answer2m:'Idempotency-Key + unique constraint.',followUps:['GET vs POST?'],trick:'Always safe to retry POST.'},
  {id:'s5',topic:'Senior',question:'Timeout vs circuit breaker?',answer30s:'Timeout bounds one call; CB stops calling after repeated bad outcomes.',answer2m:'Both needed; slowCall bridges them.',followUps:['Read vs connect timeout?']},
  {id:'s6',topic:'Senior',question:'What is a bulkhead?',answer30s:'Isolate concurrency/pools so notification meltdown does not kill payments.',answer2m:'Semaphore vs thread-pool.',followUps:['Sizing?']},
  {id:'s7',topic:'Senior',question:'10 instances each with local rate limiter 100/s?',answer30s:'≈1000/s cluster — not 100. Need GW/Redis/mesh for global.',answer2m:'Show multiplication.',followUps:['Tenant RL?']},
  {id:'s8',topic:'Senior',question:'Fake SUCCESS fallback?',answer30s:'Unacceptable for money — use PENDING/fail and reconcile.',answer2m:'Risk/compliance angle.',followUps:['OK fallbacks?']},
  {id:'s9',topic:'Senior',question:'Exponential backoff + jitter?',answer30s:'Grow wait; randomize to avoid thundering herd.',answer2m:'Wave diagram.',followUps:['Max wait?']},
  {id:'s10',topic:'Senior',question:'Retry amplification?',answer30s:'Nested retries multiply load (3×3×3=27). One retry owner.',answer2m:'ADR across services.',followUps:['Mesh + app?']},
];

export const ARCHITECT: InterviewQ[] = [
  {id:'a1',topic:'Architect',question:'Payment service down 10 minutes — what happens?',answer30s:'CB opens after threshold; fallback PENDING; alerts; no thread collapse if BH sized; after wait HALF_OPEN probes.',answer2m:'Customer messaging + ops runbook.',followUps:['Failback?']},
  {id:'a2',topic:'Architect',question:'Prevent cascading failures?',answer30s:'Timeouts + BH + CB + admit RL; isolate thread pools; no nested retries.',answer2m:'Draw A→B→C collapse vs protected.',followUps:['Shared Tomcat pool?']},
  {id:'a3',topic:'Architect',question:'Retry + CircuitBreaker together?',answer30s:'Order matters; attempts usually count in CB window; latency budget = attempts×timeout.',answer2m:'Show decorator composition.',followUps:['Retry outside CB?']},
  {id:'a4',topic:'Architect',question:'Choose failureRateThreshold?',answer30s:'From SLO/error budget and dependency criticality — e.g. 50% with min 20 calls; tune via metrics.',answer2m:'Too low flaps; too high cascades.',followUps:['slowCallRate?']},
  {id:'a5',topic:'Architect',question:'Tenant-level resilience?',answer30s:'Per-tenant RL/BH for fairness; shared CB for bank; bound metric cardinality.',answer2m:'Architecture diagram.',followUps:['Redis directory?']},
  {id:'a6',topic:'Architect',question:'R4j vs Istio retries?',answer30s:'Mesh = transport defaults; app = business idempotency. One retry owner for payments.',answer2m:'Comparison table.',followUps:['Hystrix?']},
  {id:'a7',topic:'Architect',question:'Kafka + Resilience4j?',answer30s:'Prefer retry topics/DLQ; careful with blocking retry in poll; CB around sync side effects.',answer2m:'Poison message path.',followUps:['Replay?']},
  {id:'a8',topic:'Architect',question:'DB write retries?',answer30s:'Dangerous without idempotent upsert; prefer fail + user retry; CB on pool exhaustion.',answer2m:'Socket timeout after commit story.',followUps:['Read replicas?']},
  {id:'a9',topic:'Architect',question:'How to test CB in CI?',answer30s:'Programmatic registry + stub failing client; assert OPEN after N failures; WireMock.',answer2m:'Show test sketch.',followUps:['HALF_OPEN?']},
  {id:'a10',topic:'Architect',question:'Timeout budget across GW→Order→Payment→Bank?',answer30s:'Outer ≤ sum inners; set connect/read/TL decreasing inward; cancel work when client gone.',answer2m:'Numeric example 3s/2s/1.5s/200ms.',followUps:['cancelRunningFuture?']},
];

export const RAPID_QS = [
  'CLOSED vs OPEN vs HALF_OPEN?',
  'COUNT_BASED vs TIME_BASED?',
  'slowCallDurationThreshold?',
  'IgnoreExceptions example?',
  'Semaphore vs ThreadPool bulkhead?',
  'limitForPeriod meaning?',
  'Why fallbackMethod signature matters?',
  'Actuator endpoint for CB?',
  'What is thundering herd?',
  'Spring Retry vs Resilience4j?',
  'When is Cache module useful?',
  'Correlation ID on retry logs?',
  '429 vs CB OPEN response?',
  'Self-invocation AOP pitfall?',
  'Payment PENDING vs SUCCESS?',
];

export const RAPID: InterviewQ[] = RAPID_QS.map((q, i) => ({
  id: `r${i + 1}`,
  topic: 'Rapid',
  question: q,
  answer30s: 'See cheat sheet / module topic.',
  answer2m: 'Expand with banking example and metric.',
  followUps: ['Production pitfall?'],
}));

export const ALL = [...SENIOR, ...ARCHITECT, ...RAPID];
