import type {Metadata} from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Distributed Systems — Interview Curricula',
  description:
    'Staff/Principal distributed-systems curricula: CAP, locking (2PL/3PL), consistent hashing, gateway lab, CDC/outbox. One card per curriculum — no duplicate chapter dump.',
};

/** One card per curriculum destination. Deep locking chapters live under the master index. */
const CURRICULA = [
  {
    href: '/cap-theorem',
    number: '00',
    title: 'CAP Theorem',
    blurb: 'Consistency vs availability under partition — draw it before locking or replication debates.',
  },
  {
    href: '/distributed-systems/distributed-locking-master-index',
    number: '01',
    title: 'Distributed locking curriculum',
    blurb:
      'JVM → Redis/Redisson → ZooKeeper/etcd → PostgreSQL → Saga → Kafka → fencing → K8s failures → 50+ Q&As. Open the index, then deep chapters.',
  },
  {
    href: '/distributed-systems/2pl-3pl-money-transfer-interview',
    number: '02',
    title: '2PL / 3PL money-transfer interview',
    blurb: 'Diagrams + spoken answer + full distributed-locking/ Spring source on one page for the room.',
  },
  {
    href: '/distributed-systems/consistent-hashing',
    number: '03',
    title: 'Consistent hashing',
    blurb: 'Partitioning, virtual nodes, remapping — interview whiteboard staple.',
  },
  {
    href: '/distributed-systems/gateway-live-interview-lab',
    number: '04',
    title: 'API gateway live interview lab',
    blurb: 'Eureka → lb:// → fail-closed payments companion for the /api-gateway hub.',
  },
  {
    href: '/distributed-systems/cdc-and-outbox',
    number: '05',
    title: 'CDC and outbox',
    blurb: 'Dual-write avoidance, change data capture, and reliable cross-service events.',
  },
  {
    href: '/distributed-systems/oauth2-jwt-spring-boot-demo',
    number: '06',
    title: 'OAuth2 / JWT lab companion',
    blurb: 'Walkthrough paired with the OAuth/JWT demo UI — not a second security encyclopedia.',
  },
  {
    href: '/distributed-systems/spring-security-authn-authz-demo',
    number: '07',
    title: 'Spring Security authn/authz lab',
    blurb: 'Companion for the auth demo — deep filters/method security live under /spring-security.',
  },
] as const;

const RELATED = [
  {href: '/distributed-locking', label: 'Distributed Locking hub', blurb: 'Visual/code React board'},
  {href: '/java-locking', label: 'Java Locking', blurb: 'JVM locks taxonomy'},
  {href: '/load-balancing', label: 'Load balancing', blurb: 'LB interview hub'},
  {href: '/distributed-caching', label: 'Distributed caching', blurb: 'Redis cache patterns'},
  {href: '/resilience4j', label: 'Resilience4j', blurb: 'Timeout · CB · bulkhead'},
  {href: '/kafka-interview', label: 'Kafka interview', blurb: 'Producer · consumer · DLQ'},
  {href: '/api-gateway', label: 'API Gateway', blurb: 'Theory + live lab'},
  {href: '/microservice-communication', label: 'How services talk', blurb: 'Sync · async · discovery'},
] as const;

export default function Distributed() {
  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Scale · Failure · Consistency
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Distributed systems
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Reason about scale, failure, and consistency.{' '}
          <strong>One card per curriculum</strong> — locking depth lives under the master index, not as a wall of
          20 duplicate chapter cards. Thin surveys that twin React hubs are stubs (Kafka, LB, cache, short Saga).
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Start with{' '}
          <Link href="/cap-theorem" className="font-semibold text-slate-700 underline underline-offset-4 dark:text-slate-300">
            CAP Theorem
          </Link>
          , then locking or messaging boards for implementation depth.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Interview curricula</h2>
        <p className="mt-2 text-sm text-slate-500">Each destination appears once. Open an index, then deep chapters.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CURRICULA.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">{page.number}</div>
              <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{page.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{page.blurb}</p>
              <div className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Open →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">45-minute revision path</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <li>
            <strong>§00 CAP</strong> — pick C or A under partition for a payment vs feed example.
          </li>
          <li>
            <strong>§02 2PL/3PL</strong> — draw concurrent transfers and say where fencing belongs.
          </li>
          <li>
            <strong>§01 Locking index</strong> — skim Redis lease + Postgres FOR UPDATE chapters only.
          </li>
          <li>
            <strong>§05 CDC/outbox</strong> — dual-write problem in 90 seconds.
          </li>
          <li>
            <strong>§03 Consistent hashing</strong> — virtual nodes + remapping cost.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Related hubs</h2>
        <p className="mt-2 text-sm text-slate-500">
          Load balancing, caching, resilience, and Kafka live on dedicated hubs — stubs under this section redirect
          there (not listed twice).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800"
            >
              <div className="font-semibold text-slate-900 dark:text-white">{r.label}</div>
              <div className="mt-1 text-slate-500">{r.blurb}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
