import type {ProdTopic} from './types';

export const TOPICS_A: ProdTopic[] = [
  {
    id: 'golden-rule',
    title: 'Golden Troubleshooting Rule',
    badge: 'Core',
    problem: 'Incident declared — engineers want to restart, flush, rollback blindly.',
    whenToUse: 'Every production incident before destructive actions.',
    whenAvoid: 'Skipping evidence when “just reboot” destroys the crime scene.',
    mermaid: `flowchart TD
  I[PROD ISSUE] --> NG[DO NOT GUESS]
  NG --> M[Metrics]
  M --> L[Logs]
  L --> T[Traces]
  T --> C[Recent Change]
  C --> H[Hypothesis]
  H --> V[Verify]
  V --> MIT[Mitigate first]
  MIT --> FIX[Fix root cause]`,
    code: `RULE: Mitigate customer pain — preserve evidence where practical.

Do NOT blindly:
  restart pods · kill threads · flush Redis · DELETE data · rollback

Until you know:
  blast radius · recent change · golden signals · hypothesis

Preserve: timelines, traceIds, thread dumps, query samples, deploy version`,
    failure: 'Restart clears stuck threads → outage returns in 10 min with no dump.',
    production: 'Incident Commander owns freeze on unrelated deploys + evidence pack.',
    interview30s: 'Metrics→logs→traces→change→hypothesis→verify→mitigate→fix. Do not guess.',
    followUp: 'When is immediate rollback OK?',
    tradeoff: 'Speed of mitigation vs completeness of RCA evidence.',
    memoryTrick: 'Observe before you operate.',
  },
  {
    id: 'severity',
    title: 'Incident Severity P1–P4',
    badge: 'Sev',
    problem: 'Is this a bridge or a ticket?',
    whenToUse: 'First classification in the first minute.',
    whenAvoid: 'Calling everything P1 — alert fatigue.',
    mermaid: `flowchart TB
  INC[INCIDENT] --> P1[P1 Critical]
  INC --> P2[P2 Major]
  INC --> P3[P3 Minor]
  INC --> P4[P4 Info]
  P1 --> FULL[Full outage / revenue / security / corruption]
  P2 --> DEG[High latency / partial / one region]
  P3 --> LOW[Low volume / non-critical UI]
  P4 --> NO[No prod customer impact]`,
    code: `P1: payments down, auth global fail, DB unavailable, major security, data corruption
Action: bridge + IC + tech lead + biz + SRE + DBA + cloud (+ security)

P2: high latency, partial failures, one feature broken
P3: small cohort / minor UX
P4: staging noise / informational

Write severity with: users%, region, revenue path, start time`,
    failure: 'Under-severing P1 → delayed bridge → longer RTO.',
    production: 'Severity rubric in runbook; IC can raise/lower with evidence.',
    interview30s: 'P1 = critical customer/revenue/security; staff a bridge. P2 major degrade. P3 limited.',
    followUp: 'Who is Incident Commander?',
    tradeoff: 'Noise vs missed criticals.',
    memoryTrick: 'P1 = wake people · P3 = ticket tomorrow.',
  },
  {
    id: 'first5',
    title: 'First 5 Minutes Checklist',
    badge: 'Clock',
    problem: 'Payment p95 200ms→8s after deploy — what in five minutes?',
    whenToUse: 'Opening every P1/P2.',
    whenAvoid: 'Deep heap analysis before blast radius.',
    mermaid: `flowchart LR
  M0[0-1 Confirm] --> M1[1-2 Blast radius]
  M1 --> M2[2-3 Recent change]
  M2 --> M3[3-4 Golden signals]
  M3 --> M4[4-5 Mitigate choice]`,
    code: `WHO?  users / tenants / regions / devices
WHAT? symptom / error% / latency / timeouts
WHEN? start time vs deploy / infra event / traffic spike

0-1 Confirm real (not single user / bad client)
1-2 Blast radius dashboard
2-3 Deployments, config, feature flags, AWS events
3-4 Traffic Latency Errors Saturation
4-5 Rollback? shed load? disable flag? failover?

Mitigation ≠ root cause — stabilize first`,
    failure: 'Chasing one log line while 40% payments fail unmitigated.',
    production: 'Shared war-room checklist pinned in Slack/bridge.',
    interview30s: 'Confirm → blast radius → change → golden signals → pick mitigation.',
    followUp: 'What if no recent deploy?',
    tradeoff: 'Breadth first vs early deep dive.',
    memoryTrick: 'Who What When — then act.',
  },
  {
    id: 'signals',
    title: 'Golden Signals + Metrics Map',
    badge: 'SRE',
    problem: 'Which graphs open first on a payment outage?',
    whenToUse: 'Triage and continuous validation after mitigate.',
    whenAvoid: 'Inventing universal thresholds — use service baselines.',
    mermaid: `flowchart TB
  G[GOLDEN SIGNALS] --> LAT[Latency p50/p95/p99]
  G --> TR[Traffic RPS]
  G --> ER[Errors 4xx/5xx/timeouts]
  G --> SAT[Saturation CPU mem threads pools queues disk]
  FE[Frontend] --> BE[Backend] --> DB[(DB)] --> K[Kafka] --> R[(Redis)] --> INF[Infra]`,
    code: `Frontend: TTFB LCP CLS JS errors API fail%
Backend: RPS p99 CPU heap GC threads Hikari pending
DB: QPS latency connections locks deadlocks IOPS repl lag
Kafka: consumer lag throughput ISR skew
Redis: hit ratio latency memory evictions connections
Infra: CPU mem net disk DNS load

Abnormal = delta from YOUR baseline, not a magic number
Next: if latency↑ + errors↑ → traces; if sat↑ alone → capacity/leak`,
    failure: 'Tuning alerts on averages — hide p99 payment pain.',
    production: 'Dashboard per dependency + deploy markers on graphs.',
    interview30s: 'USE/Golden: Latency Traffic Errors Saturation — then drill layer metrics.',
    followUp: 'Saturation without error increase?',
    tradeoff: 'Dashboard sprawl vs missing signal.',
    memoryTrick: 'LTES — Latency Traffic Errors Saturation.',
  },
  {
    id: 'frontend',
    title: 'Angular · React · CloudFront',
    badge: 'FE',
    problem: 'Blank UI or API errors — is it browser, CDN, or backend?',
    whenToUse: 'User-reported UI / SPA / CORS / chunk errors.',
    whenAvoid: 'Only restarting API when console shows ChunkLoadError.',
    mermaid: `flowchart TD
  B[Browser] --> A[Angular/React]
  A --> H[HTTP Client]
  H --> GW[API Gateway]
  DEP[Bad FE deploy] --> CDN[CloudFront stale]
  CDN --> CHUNK[ChunkLoadError]
  RE[useEffect no deps] --> LOOP[API storm]`,
    code: `// Angular
this.http.get('/api/payments').subscribe({
  next: d => this.payments = d,
  error: e => console.error('Payment API failed', e)
});

// React BAD — infinite loop
useEffect(() => { loadPayments(); }); // missing []

// React OK
useEffect(() => { loadPayments(); }, []);

DevTools: Console → Network → Performance → Memory → Application → Security
FE vs BE vs Net:
  Network shows 500 → backend
  CORS / opaque → browser/gateway headers
  404 chunk → CDN/deploy
  Console TypeError only → FE code

Rollback FE: previous artifact → invalidate CloudFront → smoke`,
    failure: 'HTML new + JS old in CDN → ChunkLoadError for all users.',
    production: 'Cache-Control strategy + versioned assets + invalidation runbook.',
    interview30s: 'Console+Network first; ChunkLoadError=CDN/deploy; missing deps=request storm.',
    followUp: 'CORS preflight failing after gateway change?',
    tradeoff: 'Long CDN TTL vs instant rollback complexity.',
    memoryTrick: 'Blank page → Console → Network → CDN.',
  },
  {
    id: 'edge',
    title: 'API Gateway · ALB Status Codes',
    badge: 'Edge',
    problem: '401/403/429/502/503/504 — which layer owns the code?',
    whenToUse: 'Client errors and gateway/LB symptoms.',
    whenAvoid: 'Blaming Spring for 429 from gateway throttle.',
    mermaid: `flowchart TD
  C[Client] --> GW[API Gateway]
  GW --> AUTH[Auth]
  GW --> TH[Throttle]
  GW --> INT[Integration]
  GW --> ALB
  ALB --> H{Healthy targets?}
  ALB --> T502[502]
  ALB --> T503[503]
  ALB --> T504[504]`,
    code: `401 → authorizer/token expiry/clock skew
403 → WAF/IAM/authorizer deny/CORS misconfig
429 → throttle / usage plan — check GW metrics
502 → ALB cannot get valid response from target (crash/reset)
503 → no healthy targets / overload / deploy drain
504 → integration/target timeout (backend slow)

ALB checks: target health, SG, deregistration delay, sticky sessions,
  connection errors, TLS to target

curl -v https://api.../payments
# compare GW access logs vs ALB access logs vs app logs (same requestId)`,
    failure: 'Raising GW timeout hides DB slowness → longer thread holds.',
    production: 'Status-code runbook card in war room; map each code to owner team.',
    interview30s: '4xx often auth/throttle; 502/503 LB/targets; 504 timeout budget exceeded.',
    followUp: 'Connection draining during deploy causes 502?',
    tradeoff: 'Fail fast vs longer timeouts.',
    memoryTrick: '429=gate · 502=bad target talk · 503=nobody home · 504=too slow.',
  },
];
