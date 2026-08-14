import Link from 'next/link';
import {getAllPosts,getPost} from '@/lib/posts';
import {hrefForPost} from '@/lib/href';
import InterviewPractice from '@/components/interview-practice';
import DifficultyBadge from '@/components/difficulty-badge';

const banks=[
  {
    href:'/system-design',
    label:'System Design',
    level:'Senior',
    blurb:'Architecture problems, estimation, bottlenecks, and Staff follow-ups.',
  },
  {
    href:'/realtime-issues',
    label:'Real-Time Issues',
    level:'Principal',
    blurb:'Stuck threads, Aurora, Java migration, Lead Experience, and on-call playbooks.',
  },
  {
    href:'/jpmc-experience',
    label:'JPMC Experience',
    level:'Staff',
    blurb:'Hadron Cashlines, CDC, Kafka replay, Deloitte tax, RSU, Terraform, migration.',
  },
  {
    href:'/design-patterns',
    label:'Design Patterns',
    level:'Senior',
    blurb:'One hub for all 23 GoF patterns: source repo, revision cards, memory formula, poster, and mock interview.',
  },
  {
    href:'/spring-security',
    label:'Spring Security',
    level:'Staff',
    blurb:'One hub for OAuth, Authn/Authz, CSRF, CORS, OIDC, XSS, SQL injection, DDoS defense, and JPA N+1 labs.',
  },
  {
    href:'/encryption',
    label:'Encryption Algorithms',
    level:'Staff',
    blurb:'Five rooms plus PKI: certificates, CAs, trust, TLS, sign, encrypt-to-cert, Java lab.',
  },
  {
    href:'/kafka-interview',
    label:'Kafka',
    level:'Staff',
    blurb:'Interview curriculum: producer, consumer, cluster, optimization, properties, monitoring, sizing.',
  },
  {
    href:'/kafka-producer',
    label:'Kafka Producer Board',
    level:'Staff',
    blurb:'Complete producer: send() lifecycle, accumulator, acks, idempotence, PID/seq, transactions, Spring, failure matrix.',
  },
  {
    href:'/kafka-consumer',
    label:'Kafka Consumer Board',
    level:'Staff',
    blurb:'Complete consumer: poll() internals, groups, rebalance, commits, lag, poison/DLQ, EOS, k8s, failure matrix.',
  },
  {
    href:'/kafka-mastery',
    label:'Kafka Interview Mastery',
    level:'Staff',
    blurb:'One section each for producer, consumer, cluster/controller, properties, monitoring, instances, syncing, partitions.',
  },
  {
    href:'/kafka-internals',
    label:'Kafka Internals Board',
    level:'Staff',
    blurb:'How Kafka writes partitions, replicates across brokers, sizes production instances, and redelivers after a consumer crash.',
  },
  {
    href:'/hadron-dlq',
    label:'Hadron CashLines DLQ',
    level:'Staff',
    blurb:'Neptune → Kafka → Hadron: retry topics, DLQ persistence, ordering, idempotency, replay, interview bank.',
  },
  {
    href:'/multi-tenant',
    label:'Multi-Tenant SaaS',
    level:'Staff',
    blurb:'JWT tenant bind, shared schema + RLS, hybrid DBs, Redis/Kafka isolation, 40+ interview prompts.',
  },
  {
    href:'/bloom-filter',
    label:'Bloom Filter',
    level:'Staff',
    blurb:'Bit arrays, FPP math, Spring cache penetration, SSTables, Kafka hint+truth, 30 interview prompts.',
  },
  {
    href:'/rate-limiter',
    label:'Distributed Rate Limiter',
    level:'Staff',
    blurb:'Token bucket, Redis Lua, multi-level quotas, fail-open/closed, 429 headers, Spring lab.',
  },
  {
    href:'/redis-interview',
    label:'Redis Interview',
    level:'Staff',
    blurb:'Internals, Cluster/Sentinel, stampede, locks, and cache architecture.',
  },
  {
    href:'/behavioral-interview',
    label:'Behavior Interview',
    level:'Staff',
    blurb:'One hub for behavior story frameworks plus Staff+ / Principal behavioral interview banks.',
  },
  {
    href:'/leadership-principles',
    label:'Leadership Principles',
    level:'Senior',
    blurb:'All 16 Amazon LPs with strong vs weak contrasts and follow-ups.',
  },
  {
    href:'/complexity',
    label:'Complexity',
    level:'Senior',
    blurb:'Derive time and space complexity from Java code under interview pressure.',
  },
  {
    href:'/dsa',
    label:'DSA Islands & Window',
    level:'Senior',
    blurb:'Number of Islands BFS/DFS family plus sliding window problem statements and Java.',
  },
  {
    href:'/distributed-systems',
    label:'Distributed Systems',
    level:'Principal',
    blurb:'Locking, messaging, resilience, and consistency decision frameworks.',
  },
];

const practiceItems=[
  {
    question:'What happens if Kafka goes down mid-traffic?',
    think:'Producers, buffering, retries, backpressure, durability, and user-visible impact.',
    points:[
      'Separate producer and consumer failure modes.',
      'Discuss acks, retries, idempotence, and whether the outage is brokers, network, or auth.',
      'Explain backpressure to callers and what is buffered vs rejected.',
      'Cover recovery: lag catch-up, replay risk, and duplicate handling.',
    ],
    followUps:[
      'How do you protect the database when consumers catch up after an outage?',
      'What metrics prove the system is healthy again?',
    ],
  },
  {
    question:'How do you prevent duplicate payment processing?',
    think:'Idempotency keys, unique constraints, at-least-once delivery, and reconciliation.',
    points:[
      'Make the business operation idempotent, not just the HTTP handler.',
      'Use a durable uniqueness guard (DB unique key / ledger entry).',
      'Design for at-least-once Kafka delivery with safe retries.',
      'Add reconciliation for residual inconsistency.',
    ],
    followUps:[
      'What happens if the process crashes after debit but before event publish?',
      'How do you handle two concurrent retries with the same idempotency key?',
    ],
  },
  {
    question:'How would you scale a service 10×?',
    think:'Find the first bottleneck before changing architecture.',
    points:[
      'Quantify current limit: CPU, memory, DB, network, or downstream dependency.',
      'Scale the constrained resource first; avoid premature redesign.',
      'Discuss horizontal vs vertical scaling and stateful components.',
      'Call out observational proof and rollback if the change worsens latency.',
    ],
    followUps:[
      'What if the bottleneck is a single Postgres writer?',
      'How do you validate the 10× claim in a load test?',
    ],
  },
  {
    question:'What if Redis is unavailable?',
    think:'Degraded mode, stampede protection, and whether Redis is cache or source of truth.',
    points:[
      'Clarify whether Redis is optional cache or required state.',
      'Protect the database from a cache-miss storm.',
      'Define degraded behavior and timeouts explicitly.',
      'Plan recovery and warm-up to avoid thundering herds.',
    ],
    followUps:[
      'How do you avoid stampedes when Redis returns?',
      'Would you fail open or fail closed for authorization data?',
    ],
  },
];

export default function Interview(){
  const posts=getAllPosts();
  const prep=getPost('system-design-interview-preparation');
  const popular=posts
    .filter((p)=>![
      'system-design-interview-preparation',
    ].includes(p.slug))
    .slice(0,6);

  return (
    <main className="mx-auto max-w-7xl px-5 py-14">
      <div className="max-w-3xl">
        <p className="eyebrow">Interview Practice</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.04em] text-[var(--ink)] md:text-5xl">
          Practice the follow-up, not just the diagram.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Senior interviews probe failure, scale, consistency, and trade-offs. Use active recall first,
          then open the banks for deep guides.
        </p>
      </div>

      <div id="practice" className="mt-10 scroll-mt-24">
        <InterviewPractice items={practiceItems}/>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Question banks</h2>
        <p className="mt-2 text-slate-500">Choose a lane and work question → story → answer → follow-up.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {banks.map((b)=>(
            <Link
              key={b.href}
              href={b.href}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-600 dark:text-slate-300">
                  {b.label}
                </span>
                <DifficultyBadge difficulty={b.level}/>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">{b.blurb}</p>
              <div className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Open bank →</div>
            </Link>
          ))}
        </div>
      </section>

      {prep && (
        <section className="mt-14">
          <Link
            href={hrefForPost(prep.category,prep.slug)}
            className="block rounded-xl border border-slate-200 bg-white p-6 md:p-8 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">{prep.category}</span>
              <DifficultyBadge difficulty={prep.difficulty}/>
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white">{prep.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{prep.description}</p>
            <div className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Read the full preparation guide →
            </div>
          </Link>
        </section>
      )}

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Popular guides</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {popular.map((p)=>(
            <Link
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
              href={hrefForPost(p.category,p.slug)}
              key={p.slug}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-600 dark:text-slate-300">
                {p.category}
              </div>
              <div className="mt-2 font-semibold text-slate-900 dark:text-white">{p.title}</div>
              <div className="mt-2 text-xs text-slate-500">{p.tags.slice(0,3).join(' · ')}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
