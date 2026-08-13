'use client';

import Mermaid from '@/components/mermaid';

const PROBLEM = `sequenceDiagram
    autonumber
    participant App as Spring service
    participant DB as Database

    App->>DB: SELECT * FROM authors
    DB-->>App: 3 authors
    loop for each author
      App->>DB: SELECT * FROM books WHERE author_id = ?
      DB-->>App: books for that author
    end
    Note over App,DB: 1 + N queries · N equals author count`;

const JOIN_FETCH = `sequenceDiagram
    autonumber
    participant App as Spring service
    participant DB as Database

    App->>DB: SELECT a, b FROM Author a JOIN FETCH a.books
    DB-->>App: authors + books in one result set
    Note over App,DB: 1 query total · no per-author round trip`;

const BATCH = `sequenceDiagram
    autonumber
    participant App as Spring + @BatchSize
    participant DB as Database

    App->>DB: SELECT * FROM authors
    DB-->>App: 3 authors
    App->>DB: SELECT * FROM books WHERE author_id IN (1,2,3)
    DB-->>App: all books
    Note over App,DB: 1 + 1 queries · batched lazy load`;

const DETECT = `flowchart TD
  A[API slow under list endpoints] --> B[Enable Hibernate statistics or datasource proxy]
  B --> C{Same SQL repeated N times?}
  C -->|Yes| D[N+1 lazy collection/association]
  C -->|No| E[Other bottleneck]
  D --> F[Fix: join fetch / EntityGraph / batch / DTO]
  F --> G[Re-check query count in test]`;

const diagrams = [
  {
    id: 'n1-problem',
    title: 'N+1 problem — one query + N lazy loads',
    blurb: 'Load parents once, then Hibernate fires one SELECT per parent when you touch the collection.',
    chart: PROBLEM,
  },
  {
    id: 'n1-join-fetch',
    title: 'Fix — JOIN FETCH (or EntityGraph)',
    blurb: 'Load the graph in a single SQL join. Watch for cartesian products on multiple bags.',
    chart: JOIN_FETCH,
  },
  {
    id: 'n1-batch',
    title: 'Fix — batch lazy loading',
    blurb: '@BatchSize / hibernate.default_batch_fetch_size turns N queries into a few IN (…) queries.',
    chart: BATCH,
  },
  {
    id: 'n1-detect',
    title: 'How to detect in production',
    blurb: 'Repeated identical SQL with different bind ids is the smoking gun.',
    chart: DETECT,
  },
] as const;

export default function SpringNPlusOneDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="n1-diagrams-heading">
      <h2 id="n1-diagrams-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        Diagrams
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Problem shape, two common fixes, and a detection path you can say in an interview.
      </p>
      <div className="mt-6 space-y-10">
        {diagrams.map((d) => (
          <article key={d.id} id={d.id} className="scroll-mt-24">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{d.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d.blurb}</p>
            <Mermaid chart={d.chart} />
          </article>
        ))}
      </div>
    </section>
  );
}
