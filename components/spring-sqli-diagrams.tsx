'use client';

import Mermaid from '@/components/mermaid';

const CONCAT_VS_PREPARED = `sequenceDiagram
    autonumber
    participant Client
    participant Ctrl as SqlInjectionController
    participant DB as Database

    Client->>Ctrl: GET /sqli/bad?q=electronics
    Ctrl->>Ctrl: SQL = ... WHERE category = ' + q + '
    Ctrl->>DB: Execute concatenated string
    DB-->>Ctrl: Rows for category electronics

    Client->>Ctrl: GET /sqli/good?q=electronics
    Ctrl->>Ctrl: PreparedStatement with ?
    Ctrl->>DB: Bind q as data only
    DB-->>Ctrl: Same rows — structure fixed at prepare time
    Note over Ctrl,DB: ? placeholder never becomes SQL syntax`;

const OR_BYPASS = `sequenceDiagram
    autonumber
    participant Attacker
    participant Ctrl as /sqli/bad
    participant DB as Database

    Attacker->>Ctrl: q=electronics' OR '1'='1
    Ctrl->>Ctrl: WHERE category = 'electronics' OR '1'='1'
    Ctrl->>DB: Predicate always true
    DB-->>Attacker: All product rows leaked
    Note over Ctrl: Concatenation lets attacker change SQL logic`;

const PREPARED_BLOCKS = `sequenceDiagram
    autonumber
    participant Attacker
    participant Ctrl as /sqli/good
    participant DB as Database

    Attacker->>Ctrl: q=electronics' OR '1'='1
    Ctrl->>DB: WHERE category = ?  bind full string as value
    DB-->>Attacker: Zero rows or literal mismatch
    Note over DB: OR clause is data inside the quotes — not SQL`;

const diagrams = [
  {
    id: 'sqli-concat-vs-prepared',
    title: 'String concat SQL vs PreparedStatement',
    blurb:
      'Bad path builds SQL with + q +. Good path uses JdbcTemplate with ? so user input is bound as a parameter, not parsed as SQL.',
    chart: CONCAT_VS_PREPARED,
  },
  {
    id: 'sqli-or-bypass',
    title: "OR 1=1 authentication / filter bypass",
    blurb:
      "Classic payload electronics' OR '1'='1 turns a category filter into a tautology and returns every row.",
    chart: OR_BYPASS,
  },
  {
    id: 'sqli-prepared-blocks',
    title: 'PreparedStatement blocks the same payload',
    blurb:
      'The identical OR payload is one string value for category. The WHERE clause shape cannot change.',
    chart: PREPARED_BLOCKS,
  },
] as const;

export default function SpringSqliDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="spring-sqli-flows-heading">
      <h2 id="spring-sqli-flows-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        SQL injection sequence diagrams
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        Staff answer: never concatenate untrusted input into SQL; use parameterized queries / JPA bind params.
      </p>
      <div className="mt-6 space-y-8">
        {diagrams.map((d) => (
          <article key={d.id} id={d.id} className="scroll-mt-24">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{d.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d.blurb}</p>
            <Mermaid chart={d.chart} />
          </article>
        ))}
      </div>
    </section>
  );
}
