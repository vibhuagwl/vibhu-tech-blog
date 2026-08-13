import Link from 'next/link';

export const metadata = {title: 'About Vibhu Agarwal'};

export default function About() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 md:py-20">
      <p className="eyebrow">About</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-[-.04em] text-[var(--ink)] md:text-5xl">
        Engineering knowledge from building backend and financial systems.
      </h1>
      <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">
        I am Vibhu Agarwal, a software engineer focused on Java, Spring Boot, microservices, Kafka, distributed
        systems, and FinTech platforms. This site captures the reasoning used when designing systems and preparing
        for senior-level interviews.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {[
          {
            title: 'Engineering expertise',
            body: 'Java · Spring Boot · Microservices · Kafka · Distributed Systems · Cloud · APIs · Databases · Security',
          },
          {
            title: 'System design',
            body: 'High-level architecture, capacity planning, caching, messaging, consistency, reliability, and production trade-offs.',
          },
          {
            title: 'FinTech engineering',
            body: 'Payments, transaction processing, reconciliation, event-driven workflows, and correctness under partial failure.',
          },
          {
            title: 'Interview preparation',
            body: 'A practical framework for requirements, estimates, architecture, bottlenecks, failure handling, and Staff-level trade-offs.',
          },
        ].map((c) => (
          <section key={c.title} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <h2 className="text-base font-bold tracking-[-.02em] text-[var(--ink)]">{c.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{c.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <a className="btn-primary" href="https://www.linkedin.com/in/vibhuagwl/">
          LinkedIn
        </a>
        <a className="btn-secondary" href="https://github.com/vibhuagwl">
          GitHub
        </a>
        <a className="btn-secondary" href="https://leetcode.com/u/vibhuagwl/">
          LeetCode
        </a>
        <Link href="/learn" className="btn-secondary">
          Learning paths
        </Link>
      </div>
    </main>
  );
}
