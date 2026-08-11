import Link from 'next/link';
import {getAllPosts} from '@/lib/posts';

export const metadata={title:'Learning Path'};

export default function Learn(){
  const posts=getAllPosts();
  const fundamentals=posts.filter((p)=>p.category==='Fundamentals');
  const building=posts.filter((p)=>['Infrastructure','Caching','Messaging'].includes(p.category));
  const distributed=posts.filter((p)=>['Distributed Systems','Reliability'].includes(p.category));
  const designs=posts.filter((p)=>p.category==='System Design');
  const fintech=posts.filter((p)=>p.category==='FinTech');
  const sheets=posts.filter((p)=>p.category==='Cheat Sheet');
  const behavior=posts.filter((p)=>p.category==='Behavior');
  const behavioralInterview=posts.filter((p)=>p.category==='Behavioral Interview');
  const leadership=posts.filter((p)=>p.category==='Leadership Principles');
  const complexity=posts.filter((p)=>p.category==='Complexity');
  const kafkaInterview=posts.filter((p)=>p.category==='Kafka Interview');
  const plans=fundamentals.filter((p)=>p.tags.includes('Plan') || p.slug.includes('plan') || p.slug.includes('revision') || p.slug.includes('master-index'));

  return (
    <main className="mx-auto max-w-7xl px-5 py-14">
      <div className="max-w-3xl">
        <div className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Learning Path</div>
        <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">FAANG-ready system design from first principles.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Follow the curriculum path or jump by topic. Every article emphasizes decisions, bottlenecks, failure modes and trade-offs —
          depth aimed at Senior through Staff/Principal interviews.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/system-design/system-design-master-index" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">Master Index</Link>
          <Link href="/system-design/30-day-system-design-plan" className="rounded-lg border px-4 py-2 text-sm font-bold">30-Day Plan</Link>
          <Link href="/system-design/60-day-system-design-plan" className="rounded-lg border px-4 py-2 text-sm font-bold">60-Day Plan</Link>
          <Link href="/behavior" className="rounded-lg border px-4 py-2 text-sm font-bold">Behavior</Link>
          <Link href="/behavioral-interview" className="rounded-lg border px-4 py-2 text-sm font-bold">Behavioral Interview</Link>
          <Link href="/leadership-principles" className="rounded-lg border px-4 py-2 text-sm font-bold">Leadership Principles</Link>
          <Link href="/complexity" className="rounded-lg border px-4 py-2 text-sm font-bold">Complexity</Link>
          <Link href="/kafka-interview" className="rounded-lg border px-4 py-2 text-sm font-bold">Kafka Interview</Link>
        </div>
      </div>

      <div className="mt-12 space-y-12">
        <section>
          <h2 className="text-2xl font-black">0 — Curriculum & plans</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {plans.map((p)=>(
              <Link key={p.slug} href={`/system-design/${p.slug}`} className="card p-5">
                <div className="text-xs font-bold text-blue-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">1 — Fundamentals & frameworks</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {fundamentals.filter((p)=>!plans.includes(p)).map((p)=>(
              <Link key={p.slug} href={`/system-design/${p.slug}`} className="card p-5">
                <div className="text-xs font-bold text-blue-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section id="lld">
          <h2 className="text-2xl font-black">2 — Building blocks</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {building.map((p)=>(
              <Link key={p.slug} href={`/system-design/${p.slug}`} className="card p-5">
                <div className="text-xs font-bold text-blue-600">{p.category}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section id="databases">
          <h2 className="text-2xl font-black">3 — Distributed systems & reliability</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {distributed.map((p)=>(
              <Link key={p.slug} href={`/system-design/${p.slug}`} className="card p-5">
                <div className="text-xs font-bold text-blue-600">{p.category}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">4 — System design problems</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {designs.map((p)=>(
              <Link key={p.slug} href={`/system-design/${p.slug}`} className="card p-5">
                <div className="text-xs font-bold text-blue-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">5 — FinTech</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {fintech.map((p)=>(
              <Link key={p.slug} href={`/fintech/${p.slug}`} className="card p-5">
                <div className="text-xs font-bold text-blue-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">6 — Behavior</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {behavior.map((p)=>(
              <Link key={p.slug} href={`/behavior/${p.slug}`} className="card p-5">
                <div className="text-xs font-bold text-blue-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">7 — Behavioral Interview (Staff+ / Principal)</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {behavioralInterview.map((p)=>(
              <Link key={p.slug} href={`/behavioral-interview/${p.slug}`} className="card p-5">
                <div className="text-xs font-bold text-blue-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">8 — Amazon Leadership Principles</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {leadership.map((p)=>(
              <Link key={p.slug} href={`/leadership-principles/${p.slug}`} className="card p-5">
                <div className="text-xs font-bold text-blue-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">9 — Time & space complexity</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {complexity.map((p)=>(
              <Link key={p.slug} href={`/complexity/${p.slug}`} className="card p-5">
                <div className="text-xs font-bold text-blue-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">10 — Kafka Interview (Staff+ / Principal)</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {kafkaInterview.map((p)=>(
              <Link key={p.slug} href={`/kafka-interview/${p.slug}`} className="card p-5">
                <div className="text-xs font-bold text-blue-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">11 — Cheat sheets</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {sheets.map((p)=>(
              <Link key={p.slug} href={`/system-design/${p.slug}`} className="card p-5">
                <div className="text-xs font-bold text-blue-600">Revision</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
