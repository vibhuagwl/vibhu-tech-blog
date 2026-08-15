'use client';

import Link from 'next/link';
import {KAFKA_MASTERY_TOC} from '@/lib/kafka-mastery/toc';
import {
  FIVE_MIN,
  MEMORY_SENTENCE,
  REJECTION_KILLERS,
  SIXTY_SEC,
} from '@/lib/kafka-mastery/content';
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

/** Deep boards / MDX — no in-page crib copy of those curricula. */
const DEEP_LINKS = [
  {
    href: '/kafka-producer',
    n: '01',
    title: 'Producer',
    blurb: 'Complete board: send() internals, acks, idempotence, PID/seq, transactions, Spring, failures.',
  },
  {
    href: '/kafka-consumer',
    n: '02',
    title: 'Consumer',
    blurb: 'Complete board: poll(), groups, rebalance, commits, lag, DLQ, EOS, failures.',
  },
  {
    href: '/kafka-dlq',
    n: '03',
    title: 'DLQ / DLT / Retry',
    blurb: 'Complete failure recovery: classification, retry topics, Spring handlers, offsets, replay.',
  },
  {
    href: '/kafka-infra',
    n: '04',
    title: 'Production Infrastructure',
    blurb: 'How many brokers/partitions/consumers · multi-AZ/DR · capacity · incidents · Staff answers.',
  },
  {
    href: '/kafka-cluster',
    n: '05',
    title: 'Cluster & broker',
    blurb: 'Complete board: KRaft, request path, ISR, storage, multi-AZ, capacity, ops.',
  },
  {
    href: '/kafka-interview/kafka-optimization-index',
    n: '06',
    title: 'Optimization',
    blurb: 'Tune one bottleneck at a time — producer → broker → controller → cluster → consumer.',
  },
  {
    href: '/kafka-properties',
    n: '07',
    title: 'Properties',
    blurb: 'Must-set baselines and full config reference — not duplicated here.',
  },
];

const DRILL_LINKS = [
  {
    href: '/kafka-infra#monitoring',
    n: '06',
    title: 'Monitoring',
    blurb: 'Lag, URP, ISR, disk, rebalances, offline partitions.',
  },
  {
    href: '/kafka-infra#brokers',
    n: '07',
    title: 'Broker sizing',
    blurb: 'How many brokers, controllers, clusters — multi-AZ defaults.',
  },
  {
    href: '/kafka-infra#isr',
    n: '08',
    title: 'ISR & replication',
    blurb: 'Follower fetch, ISR, acks=all, high watermark — interview walk.',
  },
  {
    href: '/kafka-infra#partitions',
    n: '09',
    title: 'Partitions',
    blurb: 'Sizing formula, examples, hot keys.',
  },
  {
    href: '#interview',
    n: '10',
    title: 'Spoken answers',
    blurb: 'Senior → architect → rapid decks.',
  },
];

export default function KafkaMasteryHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Stop failing Kafka rounds
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Kafka Interview Mastery
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Interview map and spoken drills — not a second copy of the producer, consumer, cluster, or infra boards.
          Deep curricula live on those routes; Production Infrastructure owns sizing, monitoring, and incidents; this
          page owns out-loud practice.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
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
          <Link href="/kafka-infra" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Infra
          </Link>
          {' · '}
          <Link href="/kafka-cluster" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Cluster
          </Link>
          {' · '}
          <Link href="/spring-kafka-payments-demo" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Spring code
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={KAFKA_MASTERY_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="curriculum"
            title="00. Interview map — open these in order"
            lead="Deep boards first (01–07), including Production Infrastructure. Drills on this page = spoken answers only. Monitoring, instance counts, partition sizing, and incidents moved to the Infra board."
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Deep boards (one home each)</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {DEEP_LINKS.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">{c.n}</div>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{c.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{c.blurb}</p>
                  <div className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Open →</div>
                </Link>
              ))}
            </div>

            <h3 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">
              Drills — Infra deep links + spoken answers here
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {DRILL_LINKS.map((c) => {
                const isOnPage = c.href.startsWith('#');
                const className =
                  'rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950';
                const inner = (
                  <>
                    <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">{c.n}</div>
                    <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{c.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{c.blurb}</p>
                    {isOnPage ? null : (
                      <div className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Open →</div>
                    )}
                  </>
                );
                if (isOnPage) {
                  return (
                    <a key={c.href} href={c.href} className={className}>
                      {inner}
                    </a>
                  );
                }
                return (
                  <Link key={c.href} href={c.href} className={className}>
                    {inner}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rejection killers — never say these</h3>
              {REJECTION_KILLERS.map((r) => (
                <div key={r.trap} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm leading-6 text-rose-700 dark:text-rose-300">
                    <strong>Trap:</strong> {r.trap}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
                    <strong>Say instead:</strong> {r.fix}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="interview"
            title="01. Spoken answers — practice out loud"
            lead="Senior deck covers each section. Architect deck is sizing and AZ loss. Rapid deck is offsets, ISR, and instance counts under pressure."
          >
            <InterviewMode />
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">60-second answer</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{SIXTY_SEC}</p>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">5-minute board walk</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {FIVE_MIN.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-500">
              Next:{' '}
              <Link href="/kafka-infra" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Production Infrastructure
              </Link>
              {' · '}
              <Link href="/kafka-interview/kafka-payments-dlq" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Payment story + DLQ
              </Link>
              {' · '}
              <Link href="/kafka-cluster#replication" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Cluster
              </Link>
              {' · '}
              <Link href="/hadron-dlq" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Hadron DLQ
              </Link>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
