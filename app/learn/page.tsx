import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {getAllPosts} from '@/lib/posts';
import {hrefForPost} from '@/lib/href';
import {INTERVIEW_PATHS, TOPIC_GROUPS} from '@/lib/site-nav';

export const metadata={title:'Learning Path'};

export default function Learn(){
  const posts=getAllPosts();
  const plans=posts.filter(
    (p)=>
      p.category==='Fundamentals' &&
      (p.tags.includes('Plan') || p.slug.includes('plan') || p.slug.includes('revision') || p.slug.includes('master-index')),
  );

  return (
    <main className="mx-auto max-w-7xl px-5 py-14">
      <div className="max-w-3xl">
        <p className="eyebrow">Learning Path</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.04em] text-[var(--ink)] md:text-5xl">
          Six interview paths — story first, theory second.
        </h1>
        <p className="mt-5 text-lg leading-8 text-[var(--muted)]">
          Do not start by scrolling fifty links. Open a path, walk the diagrams, say the memory line out loud,
          then dive deeper only when you need it.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-black tracking-[-.03em]">Interview paths</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {INTERVIEW_PATHS.map((path)=>(
            <article key={path.id} className="home-path">
              <div className="home-path__top">
                <span className="home-path__step">{path.step}</span>
                <span className="home-path__memory">{path.memory}</span>
              </div>
              <h3 className="home-path__title">
                <Link href={path.href}>{path.title}</Link>
              </h3>
              <p className="home-path__story">{path.story}</p>
              <pre className="home-path__diagram">{path.diagram}</pre>
              <div className="home-path__footer">
                <Link href={path.href} className="home-path__cta">
                  Open hub <ArrowRight size={14} />
                </Link>
                <div className="home-path__related">
                  {path.related.map((r)=>(
                    <Link key={r.href} href={r.href} className="home-path__chip">
                      {r.label}
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-black tracking-[-.03em]">Curriculum plans</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Optional multi-week plans after you can draw the paths.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {plans.slice(0,6).map((p)=>(
            <Link key={p.slug} href={hrefForPost(p.category,p.slug)} className="card p-5">
              <div className="text-xs font-bold text-slate-600">{p.difficulty}</div>
              <h3 className="mt-2 font-bold">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{p.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-black tracking-[-.03em]">Topic directory</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Slim Topics menu — same groups as the header. Prefer a path above before browsing everything.
        </p>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {TOPIC_GROUPS.map((group)=>(
            <section key={group.id} className="home-group">
              <div className="home-group__title">{group.title}</div>
              <p className="mt-2 text-sm text-[var(--muted)]">{group.description}</p>
              <ul className="mt-4 grid gap-0.5 sm:grid-cols-2">
                {group.topics.map((t)=>(
                  <li key={t.href}>
                    <Link href={t.href} className="home-topic">
                      <span className="home-topic__label">{t.label}</span>
                      <span className="home-topic__blurb">{t.blurb}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
