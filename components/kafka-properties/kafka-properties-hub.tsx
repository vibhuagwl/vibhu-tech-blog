'use client';

import Link from 'next/link';
import {
  BROKER_CONFIGS,
  CONSUMER_CONFIGS,
  CONTROLLER_CONFIGS,
  PRODUCER_CONFIGS,
} from '@/lib/kafka-properties/catalog';
import {
  DOCS,
  GO_NOGO,
  INTERACT_SNIPPET,
  MUST_SET_BROKER,
  MUST_SET_CONSUMER,
  MUST_SET_PRODUCER,
  SPRING_MAP,
  TOPIC_COMMON,
} from '@/lib/kafka-properties/must-set';
import {KAFKA_PROPERTIES_TOC} from '@/lib/kafka-properties/toc';
import type {MustSetRow} from '@/lib/kafka-properties/types';
import PropertyCatalog from './property-catalog';
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
      {lead ? <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MustSetTable({rows}: {rows: MustSetRow[]}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-[.1em] text-slate-500 dark:bg-slate-900">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Property</th>
            <th className="px-3 py-2 text-left font-semibold">Prod target</th>
            <th className="px-3 py-2 text-left font-semibold">Why</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.property} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-3 py-2 align-top">
                <code className="font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-100">{r.property}</code>
              </td>
              <td className="px-3 py-2 align-top font-mono text-[11px] text-slate-700 dark:text-slate-200">{r.target}</td>
              <td className="px-3 py-2 align-top leading-5 text-slate-600 dark:text-slate-300">{r.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function KafkaPropertiesHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Kafka 4.0 reference
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Kafka Properties
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Payment must-set baselines first. Then searchable producer, consumer, controller, and broker catalogs
          from Apache Kafka 4.0 docs — filter by importance, jump by section.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          Lab defaults are often unsafe for payments. Start with must-set. Use the catalogs to confirm types and
          defaults — always re-check your exact minor release.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Hub:{' '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/kafka-producer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Producer
          </Link>
          {' · '}
          <Link href="/kafka-consumer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Consumer
          </Link>
          {' · '}
          <Link href="/kafka-cluster" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Cluster
          </Link>
          {' · '}
          <Link href="/kafka-interview/kafka-optimization-index" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Optimization
          </Link>
          {' · '}
          <Link href="/spring-kafka-payments-demo" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Spring code
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={KAFKA_PROPERTIES_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="must-set"
            title="00. Must-set before production"
            lead="Interview and production baseline for payment-style workloads. Memorize these before scrolling the catalogs."
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Producer</h3>
            <div className="mt-3">
              <MustSetTable rows={MUST_SET_PRODUCER} />
            </div>
            <h3 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">Consumer</h3>
            <div className="mt-3">
              <MustSetTable rows={MUST_SET_CONSUMER} />
            </div>
            <h3 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">Broker / cluster / controller</h3>
            <div className="mt-3">
              <MustSetTable rows={MUST_SET_BROKER} />
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-400">Clients</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  <code className="text-xs">security.protocol</code>, <code className="text-xs">sasl.mechanism</code>,{' '}
                  <code className="text-xs">sasl.jaas.config</code>, SSL trust/keystore
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-400">Brokers</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Listener security map, inter-broker protocol, authorizer, ACLs
                </p>
              </div>
            </div>
          </Section>

          <Section
            id="interact"
            title="01. How properties interact"
            lead="Configs only make sense in couples. Say these couplings out loud in the interview."
          >
            <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              {INTERACT_SNIPPET}
            </pre>
          </Section>

          <Section
            id="producer"
            title="02. Producer catalog"
            lead="Complete Kafka 4.0 producer client configs. Filter high importance first for interview prep."
          >
            <PropertyCatalog rows={PRODUCER_CONFIGS} docsUrl={DOCS.producer} label="Producer" />
          </Section>

          <Section
            id="consumer"
            title="03. Consumer catalog"
            lead="Complete Kafka 4.0 consumer client configs — commit, poll budget, fetch, and group membership."
          >
            <PropertyCatalog rows={CONSUMER_CONFIGS} docsUrl={DOCS.consumer} label="Consumer" />
          </Section>

          <Section
            id="controller"
            title="04. Controller / KRaft / group-coordinator"
            lead="Broker configs that own metadata quorum, offsets topic, and transaction state log."
          >
            <PropertyCatalog rows={CONTROLLER_CONFIGS} docsUrl={DOCS.broker} label="Controller / KRaft" />
          </Section>

          <Section
            id="broker"
            title="05. Broker & cluster catalog"
            lead="Full broker config surface. Prefer filtering to high importance when preparing for ops interviews."
          >
            <PropertyCatalog rows={BROKER_CONFIGS} docsUrl={DOCS.broker} label="Broker" />
          </Section>

          <Section
            id="topic"
            title="06. Topic-level configs (common)"
            lead="Topic overrides via Admin / kafka-configs. Full list is in the official topic docs."
          >
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-[.1em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Property</th>
                    <th className="px-3 py-2 text-left font-semibold">Typical use</th>
                  </tr>
                </thead>
                <tbody>
                  {TOPIC_COMMON.map((r) => (
                    <tr key={r.property} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2">
                        <code className="font-mono text-[11px] font-semibold">{r.property}</code>
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{r.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Full topic-level list:{' '}
              <a href={DOCS.topic} target="_blank" rel="noreferrer" className="font-semibold text-slate-700 underline-offset-2 hover:underline dark:text-slate-300">
                Topic configs
              </a>
            </p>
          </Section>

          <Section id="spring" title="07. Spring Kafka mapping" lead="application.yml keys that map to client configs.">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-[.1em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Spring</th>
                    <th className="px-3 py-2 text-left font-semibold">Kafka client</th>
                  </tr>
                </thead>
                <tbody>
                  {SPRING_MAP.map((r) => (
                    <tr key={r.spring} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2">
                        <code className="font-mono text-[11px]">{r.spring}</code>
                      </td>
                      <td className="px-3 py-2">
                        <code className="font-mono text-[11px] text-slate-600 dark:text-slate-300">{r.kafka}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="go-nogo" title="08. GO / NO-GO" lead="Do not ship payments without walking this list.">
            <ul className="space-y-2">
              {GO_NOGO.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-7 text-slate-500">
              Next:{' '}
              <Link href="/kafka-interview/kafka-optimization-index" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Optimization
              </Link>
              {' · '}
              <Link href="/kafka-producer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Producer
              </Link>
              {' · '}
              <Link href="/kafka-consumer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Consumer
              </Link>
              {' · '}
              <Link href="/kafka-cluster" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Cluster
              </Link>
              {' · '}
              <Link href="/kafka-mastery" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Mastery
              </Link>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
