import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {getAllPosts} from '@/lib/posts';
import {hrefForPost} from '@/lib/href';
import DifficultyBadge from '@/components/difficulty-badge';
import {INTERVIEW_PATHS, TOPIC_GROUPS} from '@/lib/site-nav';

export default function Home() {
  const all = getAllPosts();
  const prep = all.find((p) => p.slug === 'system-design-interview-preparation');
  const featured = [
    ...(prep ? [prep] : []),
    ...all.filter((p) =>
      [
        'stuck-thread-incident-response',
        'java-migration-master-index',
        'lead-experience-master-index',
        'distributed-locking-master-index',
        'performance-master-index',
      ].includes(p.slug),
    ),
  ]
    .filter((p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i)
    .slice(0, 4);

  return (
    <main>
      <section className="home-hero" aria-label="Introduction">
        <div className="home-hero__bg" aria-hidden="true" />
        <div className="home-hero__inner">
          <p className="home-hero__brand">Vibhu Architect</p>
          <span className="home-hero__rule" aria-hidden="true" />
          <h1 className="home-hero__headline">
            Interview prep you can draw — stories, diagrams, memory rules.
          </h1>
          <p className="home-hero__dek">
            Six clear paths for Senior/Staff interviews. Less catalog dump. More “what happens when B is
            slow?” thinking you can say out loud.
          </p>
          <div className="home-hero__cta">
            <Link href="/learn" className="btn-primary">
              Start a path <ArrowRight size={16} />
            </Link>
            <Link href="/microservice-communication" className="btn-secondary">
              How services talk
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16">
        <p className="eyebrow">Interview paths</p>
        <h2 className="home-section-title mt-3">Pick a story. Draw it. Remember one line.</h2>
        <p className="home-section-lead">
          Each path opens on diagrams and spoken answers — deep theory stays one toggle away.
        </p>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {INTERVIEW_PATHS.map((path) => (
            <article key={path.id} className="home-path">
              <div className="home-path__top">
                <span className="home-path__step">{path.step}</span>
                <span className="home-path__memory">{path.memory}</span>
              </div>
              <h3 className="home-path__title">
                <Link href={path.href}>{path.title}</Link>
              </h3>
              <p className="home-path__story">{path.story}</p>
              <pre className="home-path__diagram" aria-label="Memory diagram">
                {path.diagram}
              </pre>
              <div className="home-path__footer">
                <Link href={path.href} className="home-path__cta">
                  Open story hub <ArrowRight size={14} />
                </Link>
                <div className="home-path__related">
                  {path.related.slice(0, 3).map((r) => (
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

      <section className="mx-auto max-w-[1400px] px-5 pb-4">
        <p className="eyebrow">Browse by topic</p>
        <h2 className="home-section-title mt-3">Four pillars — same hubs, clearer map</h2>
        <p className="home-section-lead">
          Navigate the existing engineering hubs by subject. No new articles — better wayfinding.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {TOPIC_GROUPS.map((group) => (
            <section key={group.id} className="home-group">
              <div className="home-group__title">{group.title}</div>
              <p className="mt-2 text-sm text-[var(--muted)]">{group.description}</p>
              <ul className="mt-4 space-y-1">
                {group.topics.slice(0, 6).map((t) => (
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

      <section className="home-strip">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-6 px-5 py-14">
          <div className="max-w-xl">
            <p className="eyebrow">Active recall</p>
            <h2 className="home-section-title mt-3">Practice mode</h2>
            <p className="home-section-lead">Question → think → reveal Staff follow-ups.</p>
          </div>
          <Link href="/interview-questions#practice" className="btn-secondary">
            Open practice
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Featured guides</p>
            <h2 className="home-section-title mt-3">High-signal MDX deep dives</h2>
            <p className="home-section-lead">Use after the story hub — not as the first click.</p>
          </div>
          <Link href="/learn" className="text-sm font-bold text-[var(--accent)] hover:underline">
            Full learning path →
          </Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {featured.map((p) => (
            <Link href={hrefForPost(p.category, p.slug)} key={p.slug} className="home-featured">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--accent)]">
                  {p.category}
                </span>
                <DifficultyBadge difficulty={p.difficulty} />
              </div>
              <h3 className="mt-3 text-lg font-bold tracking-[-.02em] text-[var(--ink)]">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{p.description}</p>
              <div className="mt-4 font-mono text-[11px] text-[var(--muted)]">{p.readingTime}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
