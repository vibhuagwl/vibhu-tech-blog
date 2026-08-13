'use client';

import Mermaid from '@/components/mermaid';

const REFLECTED = `sequenceDiagram
    autonumber
    actor Attacker
    actor Victim
    participant Browser
    participant App as Spring app

    Attacker->>Victim: Share crafted URL with script in name=
    Victim->>Browser: Click link
    Browser->>App: GET /xss/bad?name=script-payload
    App-->>Browser: HTML via th:utext unescaped
    Browser->>Browser: Executes attacker script in victim session
    Note over Browser,App: Reflected XSS — payload never stored`;

const STORED = `sequenceDiagram
    autonumber
    actor Attacker
    participant App as Spring app
    actor Victim
    participant Browser

    Attacker->>App: POST comment with script payload
    App->>App: Persist comment as-is
    Victim->>Browser: Open comments page
    Browser->>App: GET /comments
    App-->>Browser: HTML with stored script
    Browser->>Browser: Script runs for every viewer
    Note over App: Stored XSS — one write, many victims`;

const FIX = `sequenceDiagram
    autonumber
    actor Victim
    participant Browser
    participant App as Spring app

    Victim->>Browser: Open /xss/good?name=script-payload
    Browser->>App: GET with same payload
    App->>App: th:text escapes HTML entities
    App-->>Browser: Hello escaped-script as plain text
    Browser->>Browser: No script execution
    Note over App: HtmlUtils.htmlEscape for string HTML APIs`;

const diagrams = [
  {
    id: 'xss-reflected',
    title: 'Reflected XSS — crafted URL → browser executes script',
    blurb:
      'Attacker tricks the victim into opening a URL. The app reflects the query param with th:utext (or raw string HTML). The victim browser runs the script in the app origin.',
    chart: REFLECTED,
  },
  {
    id: 'xss-stored',
    title: 'Stored XSS — persist once, hit every viewer',
    blurb:
      'Malicious markup is saved (comment, profile, ticket). Every later reader gets the payload in the HTML response until it is scrubbed.',
    chart: STORED,
  },
  {
    id: 'xss-fix',
    title: 'Fix — encode output with th:text / HtmlUtils',
    blurb:
      'Thymeleaf th:text escapes by default. For @ResponseBody HTML strings use HtmlUtils.htmlEscape. Prefer Content-Type application/json for APIs.',
    chart: FIX,
  },
] as const;

export default function SpringXssDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="spring-xss-flows-heading">
      <h2 id="spring-xss-flows-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        XSS sequence diagrams
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        Interview story: reflected vs stored → why the browser trusts the origin → encode on the way out.
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
