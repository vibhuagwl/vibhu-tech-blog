/** Staff/Principal gap analysis of the unified /kafka-dlq board (live scorecard). */

export const GAP_INTRO =
  'This board already covers consumer-side Spring Kafka DLT comprehensively. The sections below close Staff/Principal gaps: producer ≠ consumer DLQ, DLT publish failure, rebalance races, Kafka EOS vs PostgreSQL, replay loops, multi-service ownership, multi-region, and payment reconciliation.';

export type ScoreRow = {area: string; score: number; note: string};

/** Scores after the production-deep expansion (target state for this page). */
export const ARTICLE_SCORES: ScoreRow[] = [
  {area: 'Fundamentals', score: 9, note: 'Broker has no DLQ; app/Spring owns classify → retry → DLT → commit.'},
  {area: 'Retry', score: 9, note: 'DEH, @RetryableTopic, manual hops, external scheduler, parking lot compared.'},
  {area: 'Offsets', score: 10, note: 'DLT-then-commit vs commit-then-DLT vs transactional commitRecovered.'},
  {area: 'Transactions', score: 9, note: 'ARP + fence; Kafka EOS ≠ PostgreSQL atomicity spelled out.'},
  {area: 'Ordering', score: 9, note: 'Blocking vs skip-to-DLT vs retry-topic reordering with A/B/C walkthroughs.'},
  {area: 'Replay', score: 9, note: 'Audited replay + replayCount loop prevention + payment reconcile.'},
  {area: 'Observability', score: 9, note: 'Metrics beyond DLT count; recoverer failure Sev1; OTel chain.'},
  {area: 'Security', score: 8, note: 'ACL least privilege, PII, GDPR retention, replay RBAC.'},
  {area: 'Production readiness', score: 9, note: 'Capacity math, multi-service DLT, multi-region, chaos tests.'},
  {area: 'Interview readiness', score: 9, note: 'Wrong-answer bank + scenario drills for Staff/Principal.'},
];

export const MISSING_BEFORE: string[] = [
  'Producer-side failure taxonomy treated as consumer DLQ (technically wrong)',
  'DLT publish / recoverer failure runbook deeper than one paragraph',
  'Rebalance mid-process / mid-DLT race playbook',
  'Kafka EOS vs PostgreSQL inbox/outbox as a first-class section',
  'Replay loop prevention (replayCount / maxReplay)',
  'Pattern comparison table (DEH vs RetryableTopic vs manual vs scheduler vs parking)',
  'Multi-service per-consumer-group DLT ownership',
  'Multi-region MM2 / Cluster Linking DLT + offset non-portability',
  'Payment: timeout ≠ safe retry + reconciliation before bank call',
  'Staff interview bank with explicit wrong answers',
  'Unified 40–60 corner-case matrix + failure-injection test catalog',
  'Final financial architecture recommendation answering “what would you ship today?”',
];

export const MENTAL_MODEL_PRODUCER = `Producer-side failure
        |
        +--> Kafka unavailable
        +--> serialization failure
        +--> authorization / ACL failure
        +--> timeout / delivery.timeout
        +--> metadata / DNS / TLS / SASL failure
        +--> broker / partition / NOT_ENOUGH_REPLICAS
        +--> record too large / buffer exhaustion
        +--> idempotent fencing / txn timeout
        |
        +--> Producer retry / idempotence / transaction / Outbox
        |
        +--> NOT normally a consumer DLQ`;

export const MENTAL_MODEL_CONSUMER = `Kafka Topic
     |
     v
Consumer
     |
     +--> processing success → commit
     |
     +--> processing failure
              |
              +--> transient → bounded retry
              +--> permanent → DLT
              +--> poison → DLT immediately
              +--> unknown → bounded retry + alert → DLT`;

export const MENTAL_MODEL_NOTE =
  'The DLT write is technically a producer operation, but the failure that causes the message to enter the DLT is normally a consumer-side processing failure. Producer produce-path failures never “go to the consumer DLQ” — they must be handled with producer retries, outbox, or application-level dead-lettering of the business request.';

export const NEVER_SAY =
  'Never say: “Kafka automatically sends failed messages to DLQ.” The broker stores topics; your application or Spring Kafka classifies, retries, publishes to a DLT topic, and manages offsets.';
