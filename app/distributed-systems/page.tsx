import Link from 'next/link';
import {getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';

export const metadata={title:'Distributed Systems'};

const LOCKING_ORDER=[
  '2pl-3pl-money-transfer-interview',
  'distributed-locking-master-index',
  'locking-fundamentals-and-layers',
  'jvm-and-spring-locking',
  'distributed-locking',
  'redis-distributed-lock-deep-dive',
  'redisson-watchdog-and-fencing',
  'zookeeper-etcd-locking',
  'postgresql-locking-deep-dive',
  'pessimistic-locking-guide',
  'optimistic-locking-guide',
  'transactions-2pc-3pc-saga',
  'kafka-locking-and-idempotency',
  'concurrency-deadlocks-and-timeouts',
  'lock-observability-and-debugging',
  'locking-failures-k8s-and-security',
  'lock-performance-and-architecture',
  'nosql-locking-and-comparisons',
  'spring-boot-locking-implementations',
  'payment-inventory-locking-case-studies',
  'distributed-locking-interview-qa',
];

export default function Distributed(){
  const posts=getPostsByCategories([...SECTION_CATEGORIES['distributed-systems']]);
  const bySlug=new Map(posts.map((p)=>[p.slug,p]));
  const locking=LOCKING_ORDER.map((s)=>bySlug.get(s)).filter(Boolean) as typeof posts;
  const rest=posts.filter((p)=>!LOCKING_ORDER.includes(p.slug));
  const interview=bySlug.get('2pl-3pl-money-transfer-interview');
  const pessimistic=bySlug.get('pessimistic-locking-guide');
  const optimistic=bySlug.get('optimistic-locking-guide');
  const index=bySlug.get('distributed-locking-master-index');

  return (
    <main>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.04)] md:p-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Distributed Systems</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">Reason about scale, failure and consistency.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Core building blocks for senior backend interviews: caching, messaging, partitioning, replication,
          idempotency, resilience — plus a Principal-level <strong>Distributed Locking</strong> curriculum
          (JVM → Redis/Redisson → PostgreSQL → Kafka → fencing → production failure playbooks).
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{posts.length} topics</span>
          {interview && (
            <Link href={`/distributed-systems/${interview.slug}`} className="rounded-full bg-emerald-600 px-3 py-1 font-semibold text-white">
              2PL/3PL interview diagrams →
            </Link>
          )}
          {pessimistic && (
            <Link href={`/distributed-systems/${pessimistic.slug}`} className="rounded-full bg-amber-600 px-3 py-1 font-semibold text-white">
              Pessimistic locking →
            </Link>
          )}
          {optimistic && (
            <Link href={`/distributed-systems/${optimistic.slug}`} className="rounded-full bg-violet-600 px-3 py-1 font-semibold text-white">
              Optimistic locking →
            </Link>
          )}
          {index && (
            <Link href={`/distributed-systems/${index.slug}`} className="rounded-full bg-blue-600 px-3 py-1 font-semibold text-white">
              Full locking curriculum →
            </Link>
          )}
        </div>
      </div>

      {locking.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-black">Distributed Locking curriculum</h2>
          <p className="mt-2 text-sm text-slate-500">Staff/Principal depth — leases, fencing, Postgres, Redis, Saga, K8s, and 50+ interview Q&amp;As.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {locking.map((p)=>(
              <Link key={p.slug} href={`/distributed-systems/${p.slug}`} className="card p-6 transition hover:-translate-y-0.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">{p.difficulty} · {p.readingTime}</div>
                <h3 className="mt-3 text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-black">Other topics</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {rest.map((p)=>(
              <Link key={p.slug} href={`/distributed-systems/${p.slug}`} className="card p-6 transition hover:-translate-y-0.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">{p.category} · {p.difficulty}</div>
                <h3 className="mt-3 text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
