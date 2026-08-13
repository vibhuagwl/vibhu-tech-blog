import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {getAllPosts} from '@/lib/posts';
import {hrefForPost} from '@/lib/href';
import DifficultyBadge from '@/components/difficulty-badge';
import {TOPIC_GROUPS} from '@/lib/site-nav';

const reasons = [
  {
    title: 'Production-first depth',
    blurb: 'Incidents, capacity, failure modes, and rollback — the language of real systems, not textbook definitions.',
  },
  {
    title: 'Architect-level trade-offs',
    blurb: 'Cost, latency, availability, and ownership framed the way Staff and Principal interviewers probe.',
  },
  {
    title: 'Interview-ready delivery',
    blurb: 'Spoken answers, follow-ups, diagrams, and memory frameworks you can recall under pressure.',
  },
];

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
        'distributed-locking',
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
        <div className="home-hero__grid" aria-hidden="true" />
        <div className="home-hero__inner">
          <p className="home-hero__brand">Vibhu Tech</p>
          <span className="home-hero__rule" aria-hidden="true" />
          <h1 className="home-hero__headline">
            Structured preparation for Senior, Staff, and Principal interviews.
          </h1>
          <p className="home-hero__dek">
            Java, Spring Boot, microservices, Kafka, AWS, and production engineering — organized for clear
            thinking under interview pressure.
          </p>
          <div className="home-hero__cta">
            <Link href="/learn" className="btn-primary">
              Start learning <ArrowRight size={16} />
            </Link>
            <Link href="/interview-questions" className="btn-secondary">
              Practice questions
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16">
        <p className="eyebrow">Why this hub</p>
        <h2 className="home-section-title mt-3">Built for experienced engineers</h2>
        <p className="home-section-lead">
          Calm structure, high signal, and production vocabulary — not generic bootcamp content.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {reasons.map((r, i) => (
            <div key={r.title} className="home-reason">
              <div className="home-reason__index">0{i + 1}</div>
              <h3 className="mt-3 text-lg font-bold tracking-[-.02em] text-[var(--ink)]">{r.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{r.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pb-16">
        <p className="eyebrow">Curriculum</p>
        <h2 className="home-section-title mt-3">Browse by category</h2>
        <p className="home-section-lead">
          Same lanes as the Topics menu — pick a domain, then open an Architect-level guide.
        </p>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {TOPIC_GROUPS.map((group) => (
            <section key={group.id} className="home-group">
              <div className="home-group__title">{group.title}</div>
              <p className="mt-2 text-sm text-[var(--muted)]">{group.description}</p>
              <ul className="mt-4 grid gap-0.5 sm:grid-cols-2">
                {group.topics.map((t) => (
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
        <div className="mt-6">
          <Link href="/learn" className="text-sm font-bold text-[var(--accent)] hover:underline">
            View the full learning curriculum →
          </Link>
        </div>
      </section>

      <section className="home-strip">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-6 px-5 py-14">
          <div className="max-w-xl">
            <p className="eyebrow">Active recall</p>
            <h2 className="home-section-title mt-3">Interview practice</h2>
            <p className="home-section-lead">
              Question → think → reveal discussion points and Staff follow-ups.
            </p>
          </div>
          <Link href="/interview-questions#practice" className="btn-secondary">
            Open practice mode
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Start here</p>
            <h2 className="home-section-title mt-3">Featured guides</h2>
            <p className="home-section-lead">High-signal paths for senior technical interviews.</p>
          </div>
          <Link href="/search" className="hidden text-sm font-bold text-[var(--accent)] md:block hover:underline">
            Search all topics →
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
