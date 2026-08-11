import Link from 'next/link';
import {getAllPosts,getPost} from '@/lib/posts';

const qs=[
  ['What happens if Kafka goes down?','Discuss producer behavior, buffering, retries, backpressure and durability.'],
  ['How do you prevent duplicate processing?','Use idempotency keys, deterministic business operations and state checks.'],
  ['How would you scale 10×?','Find the first bottleneck, quantify it, then scale the constrained resource.'],
  ['What if Redis is unavailable?','Protect the database from a cache-miss storm and define degraded behavior.'],
  ['How do you choose SQL vs NoSQL?','Start with access patterns, consistency, transactions, scale and operational constraints.'],
  ['What happens during a database failure?','Discuss replication, failover, timeouts, retry budgets and recovery.'],
];

export default function Interview(){
  const posts=getAllPosts();
  const prep=getPost('system-design-interview-preparation');
  return (
    <main className="mx-auto max-w-7xl px-5 py-14">
      <div className="max-w-3xl">
        <div className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Interview Questions</div>
        <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Practice the follow-up, not just the diagram.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Senior interviews probe failure, scale, consistency and trade-offs — plus Staff+ behavioral, Kafka, Redis, and complexity prep.</p>
      </div>

      {prep && (
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <Link href={`/system-design/${prep.slug}`} className="card block p-6 transition hover:-translate-y-0.5 md:p-8">
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">{prep.category} · {prep.difficulty}</div>
            <h2 className="mt-3 text-xl font-black tracking-tight">{prep.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">{prep.description}</p>
            <div className="mt-4 text-sm font-bold text-blue-600">Read the full preparation guide →</div>
          </Link>
          <Link href="/behavioral-interview" className="card block p-6 transition hover:-translate-y-0.5 md:p-8">
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">Staff+ · Behavioral</div>
            <h2 className="mt-3 text-xl font-black tracking-tight">Behavioral Interview (30 STAR)</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">Architect-level answers: leadership, conflict, failure, mentoring, cost, executive communication, and impact.</p>
            <div className="mt-4 text-sm font-bold text-blue-600">Open Behavioral Interview →</div>
          </Link>
          <Link href="/leadership-principles" className="card block p-6 transition hover:-translate-y-0.5 md:p-8">
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">Amazon · Behavioral</div>
            <h2 className="mt-3 text-xl font-black tracking-tight">Leadership Principles (all 16)</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">STAR answers, Kafka follow-up case banks, metrics, and weak-vs-strong contrasts for every Amazon LP.</p>
            <div className="mt-4 text-sm font-bold text-blue-600">Open Leadership Principles →</div>
          </Link>
          <Link href="/kafka-interview" className="card block p-6 transition hover:-translate-y-0.5 md:p-8">
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">Staff+ · Kafka</div>
            <h2 className="mt-3 text-xl font-black tracking-tight">Kafka Interview (130+)</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">Architecture, failure, DLQ, EOS/payments, multi-region and scenario drills for Principal/Architect rounds.</p>
            <div className="mt-4 text-sm font-bold text-blue-600">Open Kafka Interview →</div>
          </Link>
          <Link href="/redis-interview" className="card block p-6 transition hover:-translate-y-0.5 md:p-8">
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">Staff+ · Redis</div>
            <h2 className="mt-3 text-xl font-black tracking-tight">Redis Interview (165+)</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">Internals, Sentinel/Cluster, stampede/hot keys, locks/Redlock, and architect designs for Principal rounds.</p>
            <div className="mt-4 text-sm font-bold text-blue-600">Open Redis Interview →</div>
          </Link>
          <Link href="/complexity" className="card block p-6 transition hover:-translate-y-0.5 md:p-8">
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">DSA · Big-O</div>
            <h2 className="mt-3 text-xl font-black tracking-tight">Time & Space Complexity</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">Best/average/worst tables for all major data structures, plus how Big-O is calculated from code.</p>
            <div className="mt-4 text-sm font-bold text-blue-600">Open Complexity →</div>
          </Link>
        </section>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {qs.map(([q,a])=>(
          <div className="card p-6" key={q}>
            <h2 className="font-bold">{q}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{a}</p>
          </div>
        ))}
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-black">Read a full design</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {posts.filter(p=>p.slug!=='system-design-interview-preparation').slice(0,6).map(p=>(
            <Link className="card p-5" href={`/system-design/${p.slug}`} key={p.slug}>
              <div className="font-bold">{p.title}</div>
              <div className="mt-2 text-xs text-slate-500">{p.tags.join(' · ')}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
