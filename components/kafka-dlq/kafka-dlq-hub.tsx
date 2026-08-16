'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {KAFKA_DLQ_TOC} from '@/lib/kafka-dlq/toc';
import {
  ALERT_ROWS,
  ANTI_PATTERNS,
  BASIC_FLOW,
  CAPACITY_EXAMPLE,
  CLASSIFY_ROWS,
  COMPACTION_NOTE,
  DELAY_NOTE,
  DLT_TOPOLOGY_ROWS,
  ENVELOPE_JSON,
  HEADER_STANDARD,
  MASTER_ARCH,
  MEMORY_SENTENCE,
  METRIC_ROWS,
  NAMING_ROWS,
  PAYLOAD_COMPARE,
  PROTOCOL_FLOW,
  PROTOCOL_TX_FLOW,
  RETENTION_ROWS,
  RETRY_STRATEGY_ROWS,
  RETRY_TOPIC_DESIGN,
  REPLAY_ARCH,
  SOURCE_CLASSES,
  TERM_ROWS,
  TX_DLT_FLOW,
  VERSION_NOTE,
  WHY_ROWS,
} from '@/lib/kafka-dlq/content';
import {
  BLOCKING_VS_NB,
  CODE_DEH,
  CODE_DESER,
  CODE_RETRYABLE,
  CODE_TX,
  DEH_ROWS,
  DLP_ROWS,
  ERROR_HANDLER_FLOW,
  RETRYABLE_ROWS,
  ROLLBACK_ROWS,
  SPRING_HEADERS_ROWS,
  SPRING_STACK_NOTE,
} from '@/lib/kafka-dlq/spring';
import {CHAOS, CORNER_CASES, FAILURE_MATRIX, TROUBLESHOOT} from '@/lib/kafka-dlq/failures';
import {CHEATS, DECISION_TREES, MASTER_FAILURE_TREE} from '@/lib/kafka-dlq/decisions';
import {
  PAYMENT_ARCH,
  PAYMENT_FAILURE_ROWS,
  PAYMENT_GUARDS,
  PAYMENT_REQS,
  REPLAY_WORKFLOW,
} from '@/lib/kafka-dlq/payments';
import {
  PAYMENTS_DEMO_BOX,
  PAYMENTS_DEMO_FILES,
  PAYMENTS_DEMO_POISON,
  PAYMENTS_DEMO_PRODUCER_PROPS,
  PAYMENTS_DEMO_RUN,
  PAYMENTS_DEMO_SUCCESS,
  PAYMENTS_DEMO_THIRTY_SEC,
} from '@/lib/kafka-dlq/payments-demo';
import {
  ARTICLE_SCORES,
  GAP_INTRO,
  MENTAL_MODEL_CONSUMER,
  MENTAL_MODEL_NOTE,
  MENTAL_MODEL_PRODUCER,
  MISSING_BEFORE,
  NEVER_SAY,
} from '@/lib/kafka-dlq/gap-analysis';
import {OUTBOX_NOTE, PRODUCER_CODE, PRODUCER_FAILURES, PRODUCER_NEQ_DLQ} from '@/lib/kafka-dlq/producer-failures';
import {
  BATCH_DEEP,
  DESER_DEEP,
  DLT_PUBLISH_FAIL,
  OFFSET_SEQUENCES,
  ORDERING_WALK,
  PARKING_VS,
  PATTERN_A,
  PATTERN_B,
  PATTERN_C,
  PATTERN_COMPARE,
  PATTERN_D,
  REBALANCE_RACES,
} from '@/lib/kafka-dlq/production-deep';
import {
  ENVELOPE_JSON as DLT_ENVELOPE_JSON,
  ENVELOPE_NOTES,
  EOS_VS_DB,
  IDEMPOTENCY_BAD,
  IDEMPOTENCY_SQL,
  REPLAY_ARCH as REPLAY_ARCH_DEEP,
  REPLAY_LOOP_CODE,
  REPLAY_LOOPS,
  SCHEMA_EVOLUTION,
} from '@/lib/kafka-dlq/eos-replay';
import {
  ALERTS,
  CAPACITY_MATH,
  CHEAT_SHEET,
  FINAL_ARCH,
  FINAL_RECOMMENDATION,
  MULTI_REGION,
  MULTI_SERVICE,
  OBS_LOG_FIELDS,
  OBS_METRICS,
  OBS_TRACE,
  PAYMENT_CODE,
  PAYMENT_RECONCILE,
} from '@/lib/kafka-dlq/multi-ops';
import {CORNER_MATRIX, MATRIX_HEADERS} from '@/lib/kafka-dlq/corner-matrix';
import {CHAOS_TEST_CODE, CHAOS_TESTS, IMPL_CLASSIFIER, IMPL_CONFIG} from '@/lib/kafka-dlq/chaos-tests';
import {BASIC_Q, SCENARIO_Q, SENIOR_Q, STAFF_Q} from '@/lib/kafka-dlq/staff-interview-bank';
import {
  CHEAT as HADRON_CHEAT,
  CHECKLIST as HADRON_CHECKLIST,
  CLOSING as HADRON_CLOSING,
  COST_MODEL,
  DECISION_MATRIX as HADRON_DECISION_MATRIX,
  FIVE_MIN as HADRON_FIVE_MIN,
  MEMORY_SENTENCE as HADRON_MEMORY,
  SIXTY_SEC as HADRON_SIXTY,
  TWO_MINUTE_STORY,
} from '@/lib/hadron-dlq/comparison';
import {PRODUCTION_MISTAKES} from '@/lib/hadron-dlq/mistakes';
import {TOPICS as HADRON_TOPICS} from '@/lib/hadron-dlq/topics';
import {ALL as HADRON_INTERVIEW} from '@/lib/hadron-dlq/interview';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import StickyToc from './sticky-toc';
import SequenceWalkthrough from '@/components/hadron-dlq/sequence-walkthrough';
import CornerCaseCatalog from '@/components/hadron-dlq/corner-case-catalog';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MiniTable({headers, rows}: {headers: string[]; rows: string[][]}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join('|')} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function KafkaDlqHub({
  hadronFiles = [],
  hadronTree = [],
  hadronDefaultPath = '',
}: {
  hadronFiles?: DemoSourceFile[];
  hadronTree?: DemoTreeNode[];
  hadronDefaultPath?: string;
}) {
  const hadronDomain = HADRON_TOPICS.filter((t) =>
    ['neptune', 'state-machine', 'cashline-ordering', 'dlq-persist', 'dlq-database', 'when-not'].includes(t.id),
  );

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Production design review · DLQ · DLT · Retry · Payments · Hadron
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Kafka DLQ / DLT / Retry — Complete Guide
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Single canonical board: failure classification → retry → DLT → offsets → replay → payments → Hadron
          CashLines → Staff production deep (producer ≠ DLQ, EOS vs DB, replay loops, multi-region).
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-rose-800 dark:text-rose-200">{NEVER_SAY}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{VERSION_NOTE}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Hub:{' '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/kafka-consumer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Consumer
          </Link>
          {' · '}
          <Link href="/spring-kafka-payments-demo" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Payments demo
          </Link>
          {' · '}
          <a href="#hadron-story" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Hadron case study
          </a>
          {' · '}
          <a href="#labs" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Labs
          </a>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
        <StickyToc items={KAFKA_DLQ_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="00. Overview & version"
            lead="Treat DLQ as a distributed failure-management and recovery architecture — not “another topic.”"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={BASIC_FLOW} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Kafka-native"
                tone="ok"
                code={`Topics, partitions, offsets
Replication / ISR
Consumer groups
Transactions (EOS inside Kafka)
Produce / Fetch / OffsetCommit APIs
No generic DLQ abstraction`}
              />
              <CodePanel
                title="App / Spring Kafka"
                code={`Exception classification
DefaultErrorHandler
DeadLetterPublishingRecoverer
@RetryableTopic
DefaultAfterRollbackProcessor
ErrorHandlingDeserializer
Replay tooling + idempotency`}
              />
            </div>
          </Section>

          <Section
            id="gap-score"
            title="00b. Production design review · scorecard"
            lead={GAP_INTRO}
          >
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2">Area</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {ARTICLE_SCORES.map((r) => (
                    <tr key={r.area} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{r.area}</td>
                      <td className="px-3 py-2 font-semibold text-emerald-700 dark:text-emerald-300">{r.score}/10</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="mt-8 text-lg font-bold text-slate-900 dark:text-white">Gaps closed in sections 37–48</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {MISSING_BEFORE.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <h3 className="mt-8 text-lg font-bold text-slate-900 dark:text-white">Mental model</h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <CodePanel title="Producer-side (NOT consumer DLQ)" code={MENTAL_MODEL_PRODUCER} />
              <CodePanel title="Consumer-side processing failure" tone="ok" code={MENTAL_MODEL_CONSUMER} />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{MENTAL_MODEL_NOTE}</p>
          </Section>

          <Section
            id="fundamentals"
            title="01. DLQ fundamentals"
            lead="A DLQ isolates poison and permanent failures so healthy traffic keeps flowing — and gives ops a place to investigate and replay."
          >
            <CodePanel
              title="What a Kafka DLQ actually is"
              tone="ok"
              code={`Kafka Topic
+ Consumer error handling
+ Producer (to DLT / retry topics)
+ Offset management
+ Retry strategy
+ Replay strategy`}
            />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Problems it solves: partition head-of-line blocking from poison, unbounded retry storms into a dead
              dependency, missing forensic context, silent skip without audit. Problems it does not solve: fixing
              root cause, guaranteeing exactly-once business side effects, replacing schema contracts, or making
              non-idempotent payments safe on replay.
            </p>
          </Section>

          <Section id="terms" title="02. DLQ vs DLT vs retry" lead="Use terms carefully — Kafka apps almost always implement a topic, not a classic queue.">
            <MiniTable headers={['Term', 'Meaning']} rows={TERM_ROWS} />
            <MiniTable headers={['Aspect', 'Detail']} rows={WHY_ROWS} />
          </Section>

          <Section
            id="why"
            title="03. Why DLQ · failure categories"
            lead="Transient failures deserve retry. Permanent and poison failures deserve isolation. Unknown failures deserve bounded retry plus alert."
          >
            <CodePanel
              title="Poison loop"
              code={`Message → Fail → Retry → Fail → Retry → Fail forever
With blocking retry: partition stalls, lag grows, max.poll.interval risk
Fix: classify → bound retries → DLT/quarantine → advance offset`}
            />
          </Section>

          <Section id="classify" title="04. Failure classification" lead="Classification drives retry, DLT, commit, alert, and human intervention.">
            <MiniTable
              headers={['Class', 'Examples', 'Retry?', 'DLT?', 'Alert?', 'Commit?', 'Replay?', 'Human?']}
              rows={CLASSIFY_ROWS}
            />
          </Section>

          <Section id="architecture" title="05. Basic DLT architecture" lead="Main topic → consumer → business logic → success commit OR classify → retry → DLT.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={MASTER_ARCH} />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Pattern', 'Example', 'Use', 'Partitions']} rows={NAMING_ROWS} />
            </div>
          </Section>

          <Section
            id="retry-strategies"
            title="06. Retry strategies"
            lead="Retry = try again. DLT = stop normal processing and park for investigation. Retrying permanent failures is dangerous."
          >
            <MiniTable
              headers={['Strategy', 'Delay', 'Ordering', 'Blocks?', 'Throughput', 'Dup risk', 'When']}
              rows={RETRY_STRATEGY_ROWS}
            />
          </Section>

          <Section id="retry-topics" title="07. Retry topics · delayed retry" lead="Non-blocking hop chain: main → retry.1 → retry.2 → retry.3 → DLT.">
            <CodePanel title="Topic hop design" tone="ok" code={RETRY_TOPIC_DESIGN} />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{DELAY_NOTE}</p>
          </Section>

          <Section id="spring" title="08. Spring Kafka DLT" lead={SPRING_STACK_NOTE}>
            <CodePanel title="Handler flow" code={ERROR_HANDLER_FLOW} />
            <div className="mt-4">
              <MiniTable headers={['Header', 'Purpose']} rows={SPRING_HEADERS_ROWS} />
            </div>
          </Section>

          <Section
            id="error-handler"
            title="09. DefaultErrorHandler"
            lead="Record-listener error path: exception → backoff → recoverer → seek/commit remaining. Default FixedBackOff(0L, 9) = 10 attempts (Spring Kafka docs)."
          >
            <MiniTable headers={['Aspect', 'Behavior', 'Prod note']} rows={DEH_ROWS} />
            <div className="mt-4">
              <CodePanel title="Production DefaultErrorHandler" tone="ok" code={CODE_DEH} />
            </div>
          </Section>

          <Section
            id="recoverer"
            title="10. DeadLetterPublishingRecoverer"
            lead="Runs after retries exhausted (or immediately for non-retryable). Default destination: originalTopic + '-dlt', same partition (Spring source)."
          >
            <MiniTable headers={['Aspect', 'Behavior', 'Note']} rows={DLP_ROWS} />
          </Section>

          <Section
            id="retryable"
            title="11. @RetryableTopic"
            lead="Non-blocking retries via retry topics. Not supported with batch listeners — use DefaultErrorHandler + recoverer for batches."
          >
            <MiniTable headers={['Aspect', 'Detail', 'Trade-off']} rows={RETRYABLE_ROWS} />
            <div className="mt-4">
              <CodePanel title="@RetryableTopic example" tone="ok" code={CODE_RETRYABLE} />
            </div>
          </Section>

          <Section
            id="rollback"
            title="12. AfterRollback · transactions"
            lead="Transactional listeners use DefaultAfterRollbackProcessor — not DefaultErrorHandler — after the failed transaction rolls back."
          >
            <MiniTable headers={['Topic', 'DefaultErrorHandler', 'DefaultAfterRollbackProcessor']} rows={ROLLBACK_ROWS} />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={TX_DLT_FLOW} />
            </div>
            <div className="mt-4">
              <CodePanel title="Transactional DLT" code={CODE_TX} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="Non-txn protocol" code={PROTOCOL_FLOW} />
              <CodePanel title="Txn protocol" tone="ok" code={PROTOCOL_TX_FLOW} />
            </div>
          </Section>

          <Section id="blocking" title="13. Blocking vs non-blocking" lead="Blocking retries sleep on the consumer thread; non-blocking hops to retry topics so the main consumer continues.">
            <MiniTable headers={['Dimension', 'Blocking', 'Non-blocking']} rows={BLOCKING_VS_NB} />
          </Section>

          <Section
            id="ordering"
            title="14. Ordering · partitions"
            lead="If B fails and moves to DLT while C succeeds, per-partition business order for that key can change unless you pause or sequence."
          >
            <CodePanel
              title="Partition 0 ordering"
              tone="ok"
              code={`A → SUCCESS (commit)
B → FAILURE → DLT (commit past B)
C → SUCCESS

Blocking retry: C waits until B succeeds or is recovered
Skip-and-DLT: C can process before B is fixed — order broken for that key
Retry topic: B processed later — order vs C not preserved unless designed

Preserve for replay: original topic, partition, key (headers + same partition index).
If DLT partition count < source, Spring may drop explicit partition — verify partitionVerification.`}
            />
          </Section>

          <Section
            id="offsets"
            title="15. Offset management · races"
            lead="The hardest question: what happens to the source offset when a message goes to DLT?"
          >
            <CodePanel
              title="Safe vs unsafe ordering"
              tone="ok"
              code={`SAFE-ish at-least-once:
  Process fail → Publish DLT → Commit source offset
  Crash after DLT before commit → redelivery → possible DLT duplicate

UNSAFE (data loss risk):
  Process fail → Commit source → (DLT publish fails or never runs)
  Message gone from consumer progress with no DLT copy

Transactional:
  BEGIN → Produce DLT → SendOffsetsToTransaction → COMMIT
  Atomicity inside Kafka; still need business idempotency on replay`}
            />
          </Section>

          <Section
            id="semantics"
            title="16. At-least-once · DLT publish failure"
            lead="Typical DLQ designs are at-least-once. Duplicate DLT records are expected under crash windows."
          >
            <CodePanel
              title="If DLT is unavailable"
              code={`Do NOT commit the source offset.
Let the record retry / pause / alert.
Otherwise you lose the only copy of a failed event.

Make DLT consumers idempotent on:
  eventId · OR · topic+partition+offset · OR · business txn id`}
            />
          </Section>

          <Section id="headers" title="17. Headers · envelope · schema" lead="Provenance lives in headers; optional envelope wraps payload for ops tools.">
            <MiniTable headers={['Header', 'Purpose']} rows={HEADER_STANDARD} />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="Envelope sketch" code={ENVELOPE_JSON} />
              <MiniTable headers={['Approach', 'Pros / cons']} rows={PAYLOAD_COMPARE} />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Huge stack traces in headers bloat records, risk PII, and can hit broker header limits — truncate or
              store errors externally. Keep DLT envelope schemas stable even when business event schemas evolve.
            </p>
          </Section>

          <Section
            id="deser"
            title="18. Serialization · Schema Registry"
            lead="If deserialization fails before the listener runs, naive DLT code never sees a typed object — use ErrorHandlingDeserializer and raw bytes."
          >
            <CodePanel title="ErrorHandlingDeserializer" tone="ok" code={CODE_DESER} />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Schema Registry outages are often transient — retry/backoff, do not DLT storm. Preserve schema id in
              headers when possible for later replay. Malformed JSON/Avro/Protobuf: quarantine with raw payload.
            </p>
          </Section>

          <Section id="exceptions" title="19. Exception matrix" lead="Map exception class → retry / DLT / commit / dup / loss / alert.">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    {['Failure', 'Retry?', 'DLT?', 'Commit?', 'Dup?', 'Loss?', 'Alert?'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FAILURE_MATRIX.map((r) => (
                    <tr key={r.failure} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-2 py-2 font-semibold text-slate-800 dark:text-slate-100">{r.failure}</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{r.retry}</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{r.dlt}</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{r.commit}</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{r.dup}</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{r.loss}</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{r.alert}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            id="poison"
            title="20. Poison · retry storms · circuit breaker"
            lead="Poison blocks partitions. Retry storms amplify outages. Combine Kafka retries with circuit breakers carefully."
          >
            <CodePanel
              title="Storm protection"
              tone="ok"
              code={`Bounded retries + jitter
Retry topics (spread load over time)
Circuit breaker: open → pause / hold, don't DLT flood
Rate limit republish
Alert on retry rate and DLT rate
Never infinite FixedBackOff.UNLIMITED_ATTEMPTS in prod`}
            />
          </Section>

          <Section id="topic-ops" title="21. Retention · capacity · naming" lead="No universal retention — drive by compliance, audit, replay window, cost, and PII.">
            <MiniTable headers={['Concern', 'Guidance']} rows={RETENTION_ROWS} />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{COMPACTION_NOTE}</p>
            <CodePanel title="Capacity sketch" code={CAPACITY_EXAMPLE} />
            <div className="mt-4">
              <MiniTable headers={['Topology', 'Example', 'Pros', 'Cons']} rows={DLT_TOPOLOGY_ROWS} />
            </div>
          </Section>

          <Section
            id="security"
            title="22. Security · privacy · governance"
            lead="DLT often holds the worst payloads — treat it as a high-sensitivity store."
          >
            <CodePanel
              title="Least privilege + privacy"
              code={`TLS + SASL to brokers
ACL: WRITE to DLT for workers; READ for ops/replay only
Mask/tokenize PII before DLT when policy requires
Separate financial DLT ACLs from general topics
Retention + deletion process for GDPR-like requests
Encrypt at rest; audit every replay
Never log full payment payloads`}
            />
          </Section>

          <Section id="obs" title="23. Observability · alerts" lead="If nobody watches DLT depth, DLT is a silent data swamp.">
            <MiniTable headers={['Metric', 'Why']} rows={METRIC_ROWS} />
            <div className="mt-4">
              <MiniTable headers={['Alert', 'Signal']} rows={ALERT_ROWS} />
            </div>
          </Section>

          <Section id="replay" title="24. Replay · idempotency" lead="Replay is a product feature: select → validate → dry-run → approve → rate-limit → monitor.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={REPLAY_ARCH} />
            </div>
            <CodePanel
              title="Idempotent replay"
              tone="ok"
              code={`Dedupe keys: eventId / paymentId / topic+partition+offset
DB UNIQUE constraint on business txn
Replay to original topic OR isolated replay topic
Reset retry headers intentionally
Assume partial prior side effects — design for re-entry`}
            />
          </Section>

          <Section id="ops" title="25. Ops · incident · SLO" lead="Alert → classify → stop storm → fix root cause → validate → replay → verify → close.">
            <MiniTable headers={['Issue', 'Symptoms', 'Causes', 'Fix']} rows={TROUBLESHOOT.map((t) => [t.title, t.symptoms, t.causes, t.fix])} />
            <div className="mt-4">
              <MiniTable headers={['Chaos', 'Expected']} rows={CHAOS} />
            </div>
          </Section>

          <Section id="payments" title="26. Payments DLT · runnable demo" lead="No accidental loss, duplicate protection, per-account ordering, audit — plus the spring-kafka-payments-demo story.">
            <MiniTable headers={['Requirement', 'Design']} rows={PAYMENT_REQS} />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={PAYMENT_ARCH} />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Failure', 'Action']} rows={PAYMENT_FAILURE_ROWS} />
            </div>
            <CodePanel title="Replay workflow" tone="ok" code={REPLAY_WORKFLOW} />
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {PAYMENT_GUARDS.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>

            <h3 className="mt-10 text-xl font-bold text-slate-900 dark:text-white">Runnable payment-api story</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Absorbed from the old <code className="text-xs">/kafka-interview/kafka-payments-dlq</code> page.{' '}
              <Link href="/spring-kafka-payments-demo" className="font-semibold underline">
                Browse full demo source
              </Link>
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={PAYMENTS_DEMO_BOX} />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Success</p>
                <Mermaid chart={PAYMENTS_DEMO_SUCCESS} />
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Poison → DLT</p>
                <Mermaid chart={PAYMENTS_DEMO_POISON} />
              </div>
            </div>
            <div className="mt-4">
              <CodePanel title="Run it" tone="ok" code={PAYMENTS_DEMO_RUN} />
            </div>
            <div className="mt-4">
              <CodePanel title="Producer properties (interview knobs)" code={PAYMENTS_DEMO_PRODUCER_PROPS} />
            </div>
            <div className="mt-4">
              <CodePanel title="Demo layout" code={PAYMENTS_DEMO_FILES} />
            </div>
            <p className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-sm leading-7 text-slate-100">
              <strong>30s answer:</strong> {PAYMENTS_DEMO_THIRTY_SEC}
            </p>
          </Section>

          <Section
            id="batch"
            title="27. Batch · ack · rebalance"
            lead="Batch listeners need BatchListenerFailedException index awareness. @RetryableTopic is not for batches."
          >
            <CodePanel
              title="Partial batch + max.poll + rebalance"
              code={`Batch A B C D E — C fails:
  Commit/ack through B; seek/retry from C; D/E not yet applied
  Or recover C to DLT then continue D/E (framework-dependent)

Manual ack: never ack before DLT publish succeeds
Rebalance mid-retry: duplicate processing risk; keep processing short
Retry sleep > max.poll.interval.ms → rebalance storm
Pause partition / use retry topics for long delays`}
            />
          </Section>

          <Section id="corners" title="28. Corner cases (generic)" lead="Every case answers: processed? DLT published? offset committed? dup? loss? recovery?">
            <div className="space-y-3">
              {CORNER_CASES.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {c.id}. {c.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{c.sequence}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
                    Processed: {c.processed} · DLT: {c.dltPublished} · Commit: {c.offsetCommitted} · Dup:{' '}
                    {c.dupRisk} · Loss: {c.lossRisk}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Recovery: {c.recovery}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="hadron-story"
            title="29. Hadron CashLines case study"
            lead="Neptune → Kafka → Hadron: FinTech DLQ with ordering holds, UNIQUE(event_id), and replay through Kafka."
          >
            <p className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">{HADRON_MEMORY}</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
              <p>
                <strong>60s:</strong> {HADRON_SIXTY}
              </p>
              <p>
                <strong>2 min:</strong> {TWO_MINUTE_STORY}
              </p>
              <p>
                <strong>5 min:</strong> {HADRON_FIVE_MIN}
              </p>
            </div>
            <div className="mt-6">
              <MiniTable headers={['Failure', 'Retry?', 'DLQ?', 'Why']} rows={HADRON_DECISION_MATRIX} />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Item', 'Unbounded', 'Bounded']} rows={COST_MODEL} />
            </div>
            <p className="mt-4 text-sm font-semibold text-emerald-800 dark:text-emerald-200">{HADRON_CLOSING}</p>
          </Section>

          <Section id="hadron-sequences" title="30. Hadron lifecycle sequences" lead="Success, retry, DLQ, replay, duplicate, out-of-order, settle-block, cancel.">
            <SequenceWalkthrough />
          </Section>

          <Section id="hadron-corners" title="31. Hadron corner cases (35)" lead="Filterable production matrix — richer than the generic corner list above.">
            <CornerCaseCatalog />
          </Section>

          <Section
            id="hadron-domain"
            title="32. Neptune · state machine · DLQ DB"
            lead="Domain pieces that do not belong in abstract DLT theory."
          >
            <div className="space-y-4">
              {hadronDomain.map((t) => (
                <details key={t.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{t.title}</summary>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{t.problem}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    Use when: {t.whenToUse} · Avoid: {t.whenAvoid}
                  </p>
                  {t.mermaid && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                      <Mermaid chart={t.mermaid} />
                    </div>
                  )}
                  {t.code && (
                    <div className="mt-3">
                      <CodePanel title="Snippet" code={t.code} />
                    </div>
                  )}
                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    <strong>30s:</strong> {t.interview30s}
                  </p>
                </details>
              ))}
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Production checklist</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                {HADRON_CHECKLIST.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <MiniTable headers={['Cheat', 'Rule']} rows={HADRON_CHEAT} />
            </div>
          </Section>

          <Section id="labs" title="33. Runnable labs" lead="Hadron CashLines lab on this page; payments demo explorer at /spring-kafka-payments-demo.">
            <CodePanel
              title="Hadron lab quick start"
              tone="ok"
              code={`cd hadron-cashlines-dlq
docker compose up -d
mvn -q spring-boot:run
# LabController scenarios: success, poison, timeout, out-of-order, duplicate, …`}
            />
            {hadronFiles.length > 0 && (
              <div className="mt-6">
                <OAuthCodeExplorer
                  files={hadronFiles}
                  tree={hadronTree}
                  defaultPath={hadronDefaultPath}
                  routeBase="/kafka-dlq"
                  ariaLabel="Hadron CashLines DLQ lab source"
                />
              </div>
            )}
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Payments Spring modules:{' '}
              <Link href="/spring-kafka-payments-demo" className="font-semibold underline">
                /spring-kafka-payments-demo
              </Link>
            </p>
          </Section>

          <Section id="antipatterns" title="34. Anti-patterns · Hadron mistakes" lead="Generic DLT anti-patterns plus CashLine production mistakes.">
            <ul className="grid gap-2 md:grid-cols-2">
              {ANTI_PATTERNS.map((a) => (
                <li
                  key={a}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300"
                >
                  {a}
                </li>
              ))}
            </ul>
            <h3 className="mt-8 text-lg font-bold text-slate-900 dark:text-white">Hadron production mistakes</h3>
            <div className="mt-3 space-y-2">
              {PRODUCTION_MISTAKES.map((m) => (
                <div key={m.bad} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                  <p className="font-semibold text-rose-700 dark:text-rose-300">Bad: {m.bad}</p>
                  <p className="mt-1 text-emerald-800 dark:text-emerald-200">Good: {m.good}</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{m.why}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="decisions" title="35. Decision trees · master architecture" lead="Staff-level decision frameworks before coding.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={MASTER_FAILURE_TREE} />
            </div>
            <div className="mt-6 space-y-6">
              {DECISION_TREES.map((d) => (
                <div key={d.id}>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{d.title}</h3>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <Mermaid chart={d.tree} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <MiniTable headers={['Class', 'Layer', 'Responsibility']} rows={SOURCE_CLASSES} />
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={MASTER_ARCH} />
            </div>
          </Section>

          <Section id="interview" title="36. Interview & cheat sheets" lead="Generic DLQ drills + Hadron CashLines track.">
            <InterviewMode />
            <h3 className="mt-10 text-lg font-bold text-slate-900 dark:text-white">Hadron interview track ({HADRON_INTERVIEW.length})</h3>
            <div className="mt-3 space-y-2">
              {HADRON_INTERVIEW.slice(0, 24).map((q) => (
                <details key={q.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                  <summary className="cursor-pointer font-medium">
                    [{q.id}] {q.question}
                  </summary>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{q.answer30s}</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{q.answer2m}</p>
                </details>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Showing 24 of {HADRON_INTERVIEW.length} — full set in source lib/hadron-dlq/interview.ts</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {CHEATS.map((c) => (
                <div key={c.title} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-[.08em] text-slate-500">{c.title}</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-300">
                    {c.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-slate-500">
              Related:{' '}
              <Link href="/kafka-consumer#errors" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Consumer errors
              </Link>
              {' · '}
              <Link href="/kafka-interview/kafka-dlq-poison-message-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Poison Q71–Q81
              </Link>
              {' · '}
              <a href="#staff-bank" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Staff wrong-answer bank (§47)
              </a>
            </p>
          </Section>

          <Section
            id="producer-failures"
            title="37. Producer failures ≠ consumer DLQ"
            lead={PRODUCER_NEQ_DLQ}
          >
            <MiniTable
              headers={['Failure', 'Handling', 'Retry', 'Consumer DLQ']}
              rows={PRODUCER_FAILURES.map((p) => [p.failure, p.handling, p.retry, p.consumerDlq])}
            />
            <div className="mt-4">
              <CodePanel title="Producer config + unknown outcome" tone="ok" code={PRODUCER_CODE} />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{OUTBOX_NOTE}</p>
          </Section>

          <Section
            id="patterns-deep"
            title="38. Patterns A–E · comparison table"
            lead="Blocking DEH, @RetryableTopic, manual hops, external scheduler, parking lot — pick deliberately."
          >
            <MiniTable
              headers={['Approach', 'Delay', 'Ordering', 'Complexity', 'Throughput', 'Best for']}
              rows={PATTERN_COMPARE}
            />
            <div className="mt-4 space-y-4">
              <CodePanel title="A — Blocking DefaultErrorHandler" code={PATTERN_A} />
              <CodePanel title="B — @RetryableTopic" code={PATTERN_B} />
              <CodePanel title="C — Manual retry topics" code={PATTERN_C} />
              <CodePanel title="D — External scheduler" code={PATTERN_D} />
              <CodePanel title="E — Parking vs DLT vs quarantine" tone="ok" code={PARKING_VS} />
              <CodePanel title="Ordering walkthrough A/B/C" code={ORDERING_WALK} />
            </div>
          </Section>

          <Section
            id="dlt-publish-fail"
            title="39. DLT publish failure · offset sequences"
            lead="Recoverer failure must seek and alert — never commit the only remaining copy away."
          >
            <CodePanel title="DLT publish failure runbook (Spring Kafka)" tone="ok" code={DLT_PUBLISH_FAIL} />
            <div className="mt-4">
              <CodePanel title="Offset sequences 1–3" code={OFFSET_SEQUENCES} />
            </div>
          </Section>

          <Section
            id="rebalance-batch-deser"
            title="40. Rebalance · batch · deserialization deep"
            lead="Spring Kafka documents recovery failure seeks, BatchListenerFailedException, and ErrorHandlingDeserializer — test them."
          >
            <CodePanel title="Rebalance races" code={REBALANCE_RACES} />
            <div className="mt-4">
              <CodePanel title="Batch partial failure" code={BATCH_DEEP} />
            </div>
            <div className="mt-4">
              <CodePanel title="Deserialization before listener" tone="ok" code={DESER_DEEP} />
            </div>
          </Section>

          <Section
            id="eos-db"
            title="41. Kafka EOS vs PostgreSQL"
            lead="Kafka transactions do not make PostgreSQL + Kafka exactly-once. Inbox/outbox + UNIQUE(event_id) do."
          >
            <CodePanel title="EOS boundary" code={EOS_VS_DB} />
            <div className="mt-4">
              <CodePanel title="Idempotency SQL" tone="ok" code={IDEMPOTENCY_SQL} />
            </div>
            <div className="mt-4">
              <CodePanel title="Charge twice anti-pattern" code={IDEMPOTENCY_BAD} />
            </div>
          </Section>

          <Section
            id="replay-loops"
            title="42. Replay loops · envelope · schema evolution"
            lead="Audited replay with replayCount caps; stable DLT envelopes; dual-read old schemas."
          >
            <CodePanel title="Replay architecture" code={REPLAY_ARCH_DEEP} />
            <div className="mt-4">
              <CodePanel title="Loop prevention" code={REPLAY_LOOPS} />
            </div>
            <div className="mt-4">
              <CodePanel title="ReplayService (Java 21)" tone="ok" code={REPLAY_LOOP_CODE} />
            </div>
            <div className="mt-4">
              <CodePanel title="DLT envelope JSON" code={DLT_ENVELOPE_JSON} />
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{ENVELOPE_NOTES}</p>
            <div className="mt-4">
              <CodePanel title="Schema evolution" code={SCHEMA_EVOLUTION} />
            </div>
          </Section>

          <Section
            id="multi-ops"
            title="43. Multi-service · multi-region · capacity · alerts"
            lead="Per-consumer-group DLT ownership, MM2/Cluster Linking caveats, storage math, alerts beyond DLT count."
          >
            <CodePanel title="Multi-service DLT ownership" tone="ok" code={MULTI_SERVICE} />
            <div className="mt-4">
              <CodePanel title="Multi-region / DR" code={MULTI_REGION} />
            </div>
            <div className="mt-4">
              <CodePanel title="Capacity calculation" code={CAPACITY_MATH} />
            </div>
            <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">Metrics</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {OBS_METRICS.map((m) => (
                <li key={m}>
                  <code className="text-xs">{m}</code>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Logs: <code className="text-xs">{OBS_LOG_FIELDS}</code>
            </p>
            <div className="mt-4">
              <CodePanel title="Tracing chain" code={OBS_TRACE} />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Alert', 'Sev', 'Why']} rows={ALERTS} />
            </div>
          </Section>

          <Section
            id="payment-reconcile"
            title="44. Payment systems · timeout ≠ safe retry"
            lead="Bank timeout may mean success at the bank. Reconcile before charge or DLT replay."
          >
            <CodePanel title="Payment + DLT design" code={PAYMENT_RECONCILE} />
            <div className="mt-4">
              <CodePanel title="Safe replay" tone="ok" code={PAYMENT_CODE} />
            </div>
          </Section>

          <Section
            id="corner-matrix"
            title="45. Corner-case matrix (50)"
            lead="Producer / consumer / DLT / batch / txn / replay / DR — retry, commit, seek, ordering, dup, loss, replay."
          >
            <MiniTable
              headers={MATRIX_HEADERS}
              rows={CORNER_MATRIX.map((c) => [
                c.id,
                c.failure,
                c.side,
                c.retry,
                c.dlt,
                c.commit,
                c.seek,
                c.ordering,
                c.dup,
                c.loss,
                c.replay,
              ])}
            />
          </Section>

          <Section
            id="chaos-tests"
            title="46. Failure-injection tests · Spring implementation"
            lead="Testcontainers sketches for every major race. Real Spring Kafka 3.x patterns — not pseudo-code."
          >
            <div className="space-y-2">
              {CHAOS_TESTS.map((t) => (
                <div key={t.name} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                  <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{t.asserts}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-4">
              <CodePanel title="IT sketches" code={CHAOS_TEST_CODE} />
              <CodePanel title="FailureClassifier" tone="ok" code={IMPL_CLASSIFIER} />
              <CodePanel title="DEH + DLP + EHD config" code={IMPL_CONFIG} />
            </div>
          </Section>

          <Section
            id="staff-bank"
            title="47. Staff/Principal Q bank · wrong answers"
            lead="110 questions: Basic 20 · Senior 30 · Staff 30 · Scenario 30 — expected, why asked, common wrong answer, follow-up."
          >
            {(
              [
                ['Basic', BASIC_Q],
                ['Senior', SENIOR_Q],
                ['Staff/Principal', STAFF_Q],
                ['Scenario', SCENARIO_Q],
              ] as const
            ).map(([label, qs]) => (
              <div key={label} className="mt-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {label} ({qs.length})
                </h3>
                <div className="mt-3 space-y-2">
                  {qs.map((q) => (
                    <details key={q.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                      <summary className="cursor-pointer font-medium">
                        [{q.id}] {q.question}
                      </summary>
                      <p className="mt-2 text-slate-700 dark:text-slate-200">
                        <strong>Expected:</strong> {q.expected}
                      </p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">
                        <strong>Why asked:</strong> {q.whyAsked}
                      </p>
                      <p className="mt-1 text-rose-700 dark:text-rose-300">
                        <strong>Wrong:</strong> {q.wrong}
                      </p>
                      <p className="mt-1 text-slate-500">
                        <strong>Follow-up:</strong> {q.followUp}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </Section>

          <Section
            id="final-arch"
            title="48. Final architecture · recommendation · cheat sheet"
            lead="What to ship for a high-volume financial system: bounded retries, no loss, ordering holds, idempotent mutates, audited replay."
          >
            <CodePanel title="Production architecture" tone="ok" code={FINAL_ARCH} />
            <p className="mt-6 rounded-2xl bg-slate-900 px-4 py-4 text-sm leading-7 text-slate-100 whitespace-pre-wrap">
              {FINAL_RECOMMENDATION}
            </p>
            <div className="mt-6">
              <MiniTable headers={['Cheat', 'Rule']} rows={CHEAT_SHEET} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
