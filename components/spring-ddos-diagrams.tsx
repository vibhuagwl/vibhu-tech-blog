'use client';

import Mermaid from '@/components/mermaid';

const VOLUMETRIC_VS_APP = `flowchart TD
  A[Traffic spike] --> B{Layer}
  B -->|L3/L4 volumetric| C[Saturate bandwidth / SYN flood]
  B -->|L7 application| D[Expensive HTTP paths / login / search]
  C --> E[CDN scrubbing · SYN cookies · Anycast]
  D --> F[WAF · rate limits · cache · autoscaling]
  E --> G[Keep origin reachable]
  F --> G
`;

const RATE_LIMIT_429 = `sequenceDiagram
    autonumber
    participant Client
    participant Filter as IpRateLimitFilter
    participant Ctrl as /ddos/ping

    Client->>Filter: GET /ddos/ping within budget
    Filter->>Ctrl: allow
    Ctrl-->>Client: 200 OK healthy

    Client->>Filter: Burst past requestsPerWindow
    Filter-->>Client: 429 Too Many Requests
    Note over Filter: Retry-After + JSON rate_limited
    Note over Filter,Ctrl: Controller never runs when limited`;

const DEFENSE_LAYERS = `flowchart TD
  Edge[CDN / Anycast edge] --> WAF[WAF bot rules]
  WAF --> GW[API gateway rate limit]
  GW --> App[Spring IpRateLimitFilter / Bucket4j]
  App --> Scale[Autoscaling + circuit breakers]
  Scale --> Origin[Healthy origin capacity]
  Edge -.->|Absorb volumetric| Origin
  WAF -.->|Block known bad patterns| Origin
`;

const diagrams = [
  {
    id: 'ddos-volumetric-vs-app',
    title: 'Volumetric vs application-layer (high level)',
    blurb:
      'L3/L4 fills pipes and handshake tables. L7 burns CPU/DB on legitimate-looking HTTP. Different layers need different defenses.',
    chart: VOLUMETRIC_VS_APP,
  },
  {
    id: 'ddos-rate-limit-429',
    title: 'App-layer rate limit → HTTP 429',
    blurb:
      'Demo IpRateLimitFilter on /ddos/**: fixed window per IP. Over budget returns 429 with Retry-After — defense only, no attack tooling.',
    chart: RATE_LIMIT_429,
  },
  {
    id: 'ddos-defense-layers',
    title: 'Defense layers — CDN · WAF · app',
    blurb:
      'Edge absorbs volume; WAF filters abuse patterns; gateway/app enforce quotas; autoscaling and backpressure protect the core.',
    chart: DEFENSE_LAYERS,
  },
] as const;

export default function SpringDdosDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="spring-ddos-flows-heading">
      <h2 id="spring-ddos-flows-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        DDoS defense diagrams
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        Interview focus: classify the layer, then stack CDN/WAF/rate limits/autoscaling — never how to attack.
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
