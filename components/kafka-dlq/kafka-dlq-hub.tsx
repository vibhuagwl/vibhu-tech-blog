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
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import StickyToc from './sticky-toc';

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

export default function KafkaDlqHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Java 21 · Spring Kafka · Apache Kafka 4.x
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Kafka DLQ / DLT — Complete Board
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          End-to-end dead-letter architecture: failure classification → retry → retry topics → DLT → offsets →
          transactions → idempotent replay → observability. Kafka has no built-in DLQ — this board covers the
          production pattern.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
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
          <Link href="/kafka-interview/kafka-realtime-case" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Payment story
          </Link>
          {' · '}
          <Link href="/hadron-dlq" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Hadron DLQ lab
          </Link>
          {' · '}
          <Link href="/spring-kafka-payments-demo" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Spring code
          </Link>
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

          <Section id="payments" title="26. Payments DLT" lead="No accidental loss, duplicate protection, per-account ordering, audit, compliance.">
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

          <Section id="corners" title="28. Corner cases" lead="Every case answers: processed? DLT published? offset committed? dup? loss? recovery?">
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

          <Section id="antipatterns" title="29. Anti-patterns" lead="Forty-plus ways teams turn DLT into a liability.">
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
          </Section>

          <Section id="decisions" title="30. Decision trees · master architecture" lead="Staff-level decision frameworks before coding.">
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
          </Section>

          <Section id="interview" title="31. Interview & cheat sheets" lead="Drill Senior / Architect / Rapid. Then skim cheat sheets before a panel.">
            <InterviewMode />
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
                Consumer errors section
              </Link>
              {' · '}
              <Link href="/kafka-interview/kafka-dlq-poison-message-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Poison Q71–Q81
              </Link>
              {' · '}
              <Link href="/hadron-dlq" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Hadron production lab
              </Link>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
