import Link from 'next/link';
import {getAllPosts} from '@/lib/posts';
import {hrefForPost} from '@/lib/href';

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
  const redisInterview=posts.filter((p)=>p.category==='Redis Interview');
  const realtimeIssues=posts.filter((p)=>p.category==='Real-Time Issues');
  const performance=posts.filter((p)=>p.category==='Performance');
  const jpmcExperience=posts.filter((p)=>p.category==='JPMC Experience');
  const plans=fundamentals.filter((p)=>p.tags.includes('Plan') || p.slug.includes('plan') || p.slug.includes('revision') || p.slug.includes('master-index'));

  return (
    <main className="mx-auto max-w-7xl px-5 py-14">
      <div className="max-w-3xl">
        <p className="eyebrow">Learning Path</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.04em] text-[var(--ink)] md:text-5xl">
          FAANG-ready system design from first principles.
        </h1>
        <p className="mt-5 text-lg leading-8 text-[var(--muted)]">
          Follow the curriculum path or jump by topic. Every article emphasizes decisions, bottlenecks, failure modes and trade-offs —
          depth aimed at Senior through Staff/Principal interviews.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/system-design/system-design-master-index" className="btn-primary">Master Index</Link>
          <Link href="/system-design/30-day-system-design-plan" className="btn-secondary">30-Day Plan</Link>
          <Link href="/system-design/60-day-system-design-plan" className="btn-secondary">60-Day Plan</Link>
          <Link href="/behavioral-interview" className="btn-secondary">Behavior Interview</Link>
          <Link href="/leadership-principles" className="btn-secondary">Leadership Principles</Link>
          <Link href="/complexity" className="btn-secondary">Complexity</Link>
          <Link href="/dsa" className="btn-secondary">DSA Islands & Window</Link>
          <Link href="/kafka-interview" className="btn-secondary">Kafka Hub</Link>
          <Link href="/kafka-producer" className="btn-secondary">Kafka Producer</Link>
          <Link href="/kafka-consumer" className="btn-secondary">Kafka Consumer</Link>
          <Link href="/kafka-cluster" className="btn-secondary">Kafka Cluster</Link>
          <Link href="/kafka-mastery" className="btn-secondary">Kafka Mastery</Link>
          <Link href="/kafka-internals" className="btn-secondary">Kafka Internals</Link>
          <Link href="/hadron-dlq" className="btn-secondary">Hadron DLQ</Link>
          <Link href="/multi-tenant" className="btn-secondary">Multi-Tenant SaaS</Link>
          <Link href="/bloom-filter" className="btn-secondary">Bloom Filter</Link>
          <Link href="/rate-limiter" className="btn-secondary">Rate Limiter</Link>
          <Link href="/redis-interview" className="btn-secondary">Redis Interview</Link>
          <Link href="/design-patterns" className="btn-secondary">Design Patterns</Link>
          <Link href="/java-compiler" className="btn-secondary">Java Compiler</Link>
          <Link href="/realtime-issues" className="btn-secondary">Real-Time Issues</Link>
          <Link href="/performance" className="btn-secondary">Performance</Link>
          <Link href="/jpmc-experience" className="btn-secondary">JPMC Experience</Link>
          <Link href="/spring-security" className="btn-secondary">Spring Security</Link>
          <Link href="/encryption" className="btn-secondary">Encryption Algorithms</Link>
        </div>
      </div>

      <div className="mt-12 space-y-12">
        <section>
          <h2 className="text-2xl font-black">0 — Curriculum & plans</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {plans.map((p)=>(
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
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
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
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
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.category}</div>
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
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.category}</div>
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
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
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
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
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
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
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
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
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
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
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
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">10 — JPMC Experience (Hadron · Tax · RSU · Platform)</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {jpmcExperience.map((p)=>(
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">11 — Kafka (Knowledge · Experience · Interview)</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {kafkaInterview.map((p)=>(
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">12 — Redis Interview (Staff+ / Principal)</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {redisInterview.map((p)=>(
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">13 — Real-Time Issues (Staff+ / Principal)</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {realtimeIssues.map((p)=>(
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">14 — Performance (Java / Spring)</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {performance.map((p)=>(
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">15 — Cheat sheets</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {sheets.map((p)=>(
              <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
                <div className="text-xs font-bold text-slate-600">Revision</div>
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
