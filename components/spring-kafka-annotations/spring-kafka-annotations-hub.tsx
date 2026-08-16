'use client';

import Link from 'next/link';
import {SKA_TOC} from '@/lib/spring-kafka-annotations/toc';
import {
  CLASS_HEADERS,
  CLASSIFICATION,
  DECISION_TREE,
  DONT_CONFUSE,
  MENTAL_MODEL,
  MENTAL_NOTE,
  PAGE_MEMORY,
  VERSION_NOTE,
} from '@/lib/spring-kafka-annotations/overview';
import {
  CONCURRENCY_DIAGRAM,
  ENABLE_CODE,
  ENABLE_INTERVIEW,
  ENABLE_WHAT,
  ENABLE_WHEN,
  ENABLE_WHEN_NOT,
  LISTENER_ATTRS,
  LISTENER_EXAMPLE,
  LISTENER_LIFECYCLE,
  MULTIPLE_LISTENERS,
  OFFSET_CODE,
  OFFSET_NOTES,
} from '@/lib/spring-kafka-annotations/listener';
import {HANDLER_CODE, HANDLER_FLOW, HANDLER_NOTES, LISTENERS_CODE, LISTENERS_NOTES} from '@/lib/spring-kafka-annotations/handler';
import {
  BACKOFF_CODE,
  BACKOFF_NOTES,
  RETRY_VS_DEH,
  RETRYABLE_ATTRS,
  RETRYABLE_CODE,
  RETRYABLE_FLOW,
  RETRYABLE_WHAT,
} from '@/lib/spring-kafka-annotations/retryable';
import {
  DLT_FAILURE,
  DLT_HANDLER_CODE,
  DLT_HANDLER_FLOW,
  DLT_HANDLER_NOTES,
  SENDTO_CODE,
  SENDTO_FLOW,
  SENDTO_NOTES,
  TX_CODE,
  TX_DB,
  TX_LISTENER_FLOW,
} from '@/lib/spring-kafka-annotations/messaging-tx';
import {
  ANTIPATTERNS,
  BATCH_NOTES,
  DESER_FLOW,
  DIAGRAMS,
  EXAMPLES,
  EXCEPTION_CODE,
  INTERACTION,
  INTERACTION_HEADERS,
  MISCONCEPTIONS,
  REFERENCE,
  REFERENCE_HEADERS,
} from '@/lib/spring-kafka-annotations/matrices';
import {GOLDEN} from '@/lib/spring-kafka-annotations/golden';
import {PRINCIPAL_Q, SENIOR_Q, STAFF_Q} from '@/lib/spring-kafka-annotations/interview';
import CodePanel from './code-panel';
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
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-2 align-top text-slate-700 dark:text-slate-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SpringKafkaAnnotationsHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Spring Kafka 3.x · Annotations only
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Spring Kafka Annotations — Production & Interview Reference
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Standalone page for annotation ownership, lifecycle, offsets, retry, DLT, transactions, and interactions —
          not producer/consumer/broker property catalogs.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {PAGE_MEMORY}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{VERSION_NOTE}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Related:{' '}
          <Link href="/kafka-dlq" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            DLQ / DLT / Retry board
          </Link>
          {' · '}
          <Link href="/kafka-properties" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka properties
          </Link>
          {' · '}
          <Link href="/spring-annotations" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Spring Boot annotations
          </Link>
          {' · '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka hub
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
        <StickyToc items={SKA_TOC} />
        <div className="min-w-0 space-y-16">
          <Section id="mental-model" title="00. What is an annotation?" lead={MENTAL_NOTE}>
            <CodePanel title="Annotation → Spring → Client API → Broker" tone="ok" code={MENTAL_MODEL} />
          </Section>

          <Section id="classification" title="01. Annotation classification" lead="Who touches produce, consume, error handling, retry, DLT, transactions.">
            <MiniTable headers={CLASS_HEADERS} rows={CLASSIFICATION} />
          </Section>

          <Section id="enable-kafka" title="02. @EnableKafka" lead="Enables listener annotation processing in the Spring application — not the broker.">
            <CodePanel title="What it does" code={ENABLE_WHAT} />
            <div className="mt-4">
              <CodePanel title="Example + Boot nuance" tone="ok" code={ENABLE_CODE} />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <strong>When:</strong> {ENABLE_WHEN}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <strong>When not:</strong> {ENABLE_WHEN_NOT}
            </p>
            <p className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-sm leading-7 text-slate-100">
              <strong>Interview:</strong> {ENABLE_INTERVIEW}
            </p>
          </Section>

          <Section
            id="kafka-listener"
            title="03. @KafkaListener — deep dive"
            lead="The primary consumer abstraction. Creates MessageListenerContainers that own KafkaConsumer poll loops."
          >
            <CodePanel title="Example" tone="ok" code={LISTENER_EXAMPLE} />
            <div className="mt-6 space-y-3">
              {LISTENER_ATTRS.map((a) => (
                <details key={a.name} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{a.name}</summary>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    <strong>What:</strong> {a.what}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    <strong>Why:</strong> {a.why}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    <strong>When:</strong> {a.when}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{a.example}</p>
                  <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                    <strong>Production impact:</strong> {a.impact}
                  </p>
                </details>
              ))}
            </div>
          </Section>

          <Section id="listener-lifecycle" title="04. @KafkaListener lifecycle" lead="Where the annotation participates from startup to commit.">
            <CodePanel title="Lifecycle" tone="ok" code={LISTENER_LIFECYCLE} />
          </Section>

          <Section id="listener-offsets" title="05. Offsets · AckMode · Acknowledgment" lead="The annotation does not commit — the container does.">
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{OFFSET_NOTES}</p>
            <div className="mt-4">
              <CodePanel title="Manual ack safe vs unsafe" code={OFFSET_CODE} />
            </div>
          </Section>

          <Section id="listener-concurrency" title="06. Concurrency" lead="Threads ≠ partitions.">
            <CodePanel title="Concurrency math" tone="ok" code={CONCURRENCY_DIAGRAM} />
          </Section>

          <Section id="multiple-listeners" title="07. Multiple @KafkaListener methods" lead="Each method gets its own container infrastructure.">
            <CodePanel title="Separate containers" code={MULTIPLE_LISTENERS} />
          </Section>

          <Section id="kafka-handler" title="08. @KafkaHandler" lead="Type-based dispatch inside one class-level @KafkaListener.">
            <CodePanel title="Polymorphic events" tone="ok" code={HANDLER_CODE} />
            <div className="mt-4">
              <CodePanel title="Dispatch flow" code={HANDLER_FLOW} />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{HANDLER_NOTES}</p>
          </Section>

          <Section id="kafka-listeners" title="09. @KafkaListeners" lead="Repeatable container for multiple @KafkaListener declarations.">
            <CodePanel title="Example" code={LISTENERS_CODE} />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{LISTENERS_NOTES}</p>
          </Section>

          <Section
            id="retryable"
            title="10. @RetryableTopic — deep dive"
            lead="Spring implements non-blocking retry via hop topics. The broker does not retry."
          >
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{RETRYABLE_WHAT}</p>
            <div className="mt-4">
              <CodePanel title="Annotated listener + DLT handler" tone="ok" code={RETRYABLE_CODE} />
            </div>
            <div className="mt-4">
              <CodePanel title="Hop chain" code={RETRYABLE_FLOW} />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Attribute', 'Meaning', 'Note']} rows={RETRYABLE_ATTRS} />
            </div>
          </Section>

          <Section id="retry-vs-deh" title="11. @RetryableTopic vs DefaultErrorHandler" lead="Choose based on ordering, delay length, and ops cost.">
            <MiniTable headers={['Feature', '@RetryableTopic', 'DefaultErrorHandler']} rows={RETRY_VS_DEH} />
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Full DLT architecture, recoverer failure, and payment reconcile live on{' '}
              <Link href="/kafka-dlq" className="font-semibold underline">
                /kafka-dlq
              </Link>
              .
            </p>
          </Section>

          <Section id="backoff" title="12. @Backoff" lead="Delay policy for @RetryableTopic hops.">
            <CodePanel title="Parameters + timeline" tone="ok" code={BACKOFF_CODE} />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{BACKOFF_NOTES}</p>
          </Section>

          <Section id="dlt-handler" title="13. @DltHandler" lead="Consumes the DLT — does not create it.">
            <CodePanel title="Example" tone="ok" code={DLT_HANDLER_CODE} />
            <div className="mt-4">
              <CodePanel title="Flow" code={DLT_HANDLER_FLOW} />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{DLT_HANDLER_NOTES}</p>
          </Section>

          <Section id="dlt-failure" title="14. @DltHandler failure" lead="DLT is not a guarantee of successful processing.">
            <CodePanel title="Failure modes" code={DLT_FAILURE} />
          </Section>

          <Section id="send-to" title="15. @SendTo" lead="Publish the listener return value via KafkaTemplate.">
            <CodePanel title="Example" tone="ok" code={SENDTO_CODE} />
            <div className="mt-4">
              <CodePanel title="Flow" code={SENDTO_FLOW} />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{SENDTO_NOTES}</p>
          </Section>

          <Section id="transactional" title="16. @Transactional" lead="Spring TX abstraction — name the transaction manager.">
            <CodePanel title="Kafka TM vs DataSource TM" tone="ok" code={TX_CODE} />
          </Section>

          <Section id="txn-listener" title="17. Kafka transaction + @KafkaListener" lead="Offsets join the producer transaction.">
            <CodePanel title="Commit / rollback" code={TX_LISTENER_FLOW} />
          </Section>

          <Section id="txn-db" title="18. @Transactional with database" lead="PostgreSQL and Kafka are not one atomic unit by default.">
            <CodePanel title="Boundary" code={TX_DB} />
          </Section>

          <Section id="interaction" title="19. Annotation interaction matrix" lead="Valid vs recommended combinations.">
            <MiniTable headers={INTERACTION_HEADERS} rows={INTERACTION} />
          </Section>

          <Section id="exceptions" title="20. Exception classification" lead="include / exclude drive retry vs immediate DLT.">
            <CodePanel title="Classifier via annotation" tone="ok" code={EXCEPTION_CODE} />
          </Section>

          <Section id="deser" title="21. Deserialization + annotations" lead="If deser fails, the listener method may never run.">
            <CodePanel title="ErrorHandlingDeserializer" code={DESER_FLOW} />
          </Section>

          <Section id="batch" title="22. Batch listeners" lead="@RetryableTopic is not supported for batch.">
            <CodePanel title="Batch rules" tone="ok" code={BATCH_NOTES} />
          </Section>

          <Section id="diagrams" title="23. Lifecycle diagrams" lead="Major annotation flows at a glance.">
            <div className="space-y-4">
              {DIAGRAMS.map((d) => (
                <CodePanel key={d.title} title={d.title} code={d.body} />
              ))}
            </div>
          </Section>

          <Section id="antipatterns" title="24. Anti-patterns" lead="Dangerous annotation habits in production.">
            <ul className="grid gap-2 md:grid-cols-2">
              {ANTIPATTERNS.map((a) => (
                <li
                  key={a}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300"
                >
                  {a}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="examples" title="25. Production examples" lead="Five realistic annotation compositions.">
            <div className="space-y-4">
              {EXAMPLES.map((e) => (
                <CodePanel key={e.title} title={e.title} tone="ok" code={e.body} />
              ))}
            </div>
          </Section>

          <Section id="misconceptions" title="26. Common misconceptions" lead="Correct the interview traps.">
            <div className="space-y-3">
              {MISCONCEPTIONS.map((m) => (
                <div key={m.wrong} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">❌ {m.wrong}</p>
                  <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">✓ {m.right}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="decision-tree" title="27. Annotation decision tree" lead="Pick annotations deliberately — and know when code/config is better.">
            <CodePanel title="Decision tree" tone="ok" code={DECISION_TREE} />
          </Section>

          <Section id="reference" title="28. Complete annotation reference" lead="Authoritative quick table.">
            <MiniTable headers={REFERENCE_HEADERS} rows={REFERENCE} />
          </Section>

          <Section id="golden" title="29. Golden rule cards" lead="Fifteen questions answered for each major annotation.">
            <div className="space-y-4">
              {GOLDEN.map((g) => (
                <details key={g.name} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <summary className="cursor-pointer text-lg font-semibold text-slate-900 dark:text-white">{g.name}</summary>
                  <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    {(
                      [
                        ['Problem', g.answers.problem],
                        ['Executes', g.answers.executes],
                        ['Owner', g.answers.owner],
                        ['Kafka API', g.answers.kafkaApi],
                        ['Offset', g.answers.offset],
                        ['On failure', g.answers.onFailure],
                        ['Creates topic?', g.answers.createsTopic],
                        ['Creates producer?', g.answers.createsProducer],
                        ['Creates consumer?', g.answers.createsConsumer],
                        ['Ordering', g.answers.ordering],
                        ['Transactions', g.answers.transactions],
                        ['Consumer groups', g.answers.consumerGroups],
                        ['Risks', g.answers.risks],
                        ['Alternative', g.answers.alternative],
                        ['When NOT', g.answers.whenNot],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                        <dt className="text-[11px] font-semibold uppercase tracking-[.08em] text-slate-500">{k}</dt>
                        <dd className="mt-1 text-slate-700 dark:text-slate-300">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ))}
            </div>
          </Section>

          <Section
            id="interview"
            title="30. Interview bank"
            lead="70 questions: Senior 25 · Staff 25 · Principal 20 — short, deep, code, mistake, follow-up."
          >
            {(
              [
                ['Senior', SENIOR_Q],
                ['Staff', STAFF_Q],
                ['Principal', PRINCIPAL_Q],
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
                        <strong>Short:</strong> {q.short}
                      </p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">
                        <strong>Deep:</strong> {q.deep}
                      </p>
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-[11px] text-slate-100">{q.code}</pre>
                      <p className="mt-1 text-rose-700 dark:text-rose-300">
                        <strong>Mistake:</strong> {q.mistake}
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

          <Section id="dont-confuse" title="31. Don't confuse these" lead="Spring owns annotations. The broker stores bytes.">
            <CodePanel title="Map" tone="ok" code={DONT_CONFUSE} />
          </Section>
        </div>
      </div>
    </div>
  );
}
