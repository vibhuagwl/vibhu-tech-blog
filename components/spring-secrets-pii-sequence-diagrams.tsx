'use client';

import Mermaid from '@/components/mermaid';

const MICROSERVICES = `flowchart LR
    Agent[Support agent] --> Edge[support-api :8086]
    Edge -->|RestClient service creds| Vault[customer-service :8085]
    Edge -->|POST audit| Audit[audit-service :8087]
    Compliance[Compliance] --> Audit
    Vault --> DB[(Encrypted PII)]
    Audit --> ADB[(Audit DB)]`;

const PII_READ = `sequenceDiagram
    autonumber
    actor Agent as Support agent
    participant Edge as support-api
    participant Vault as customer-service
    participant Audit as audit-service
    participant DB as Encrypted DB

    Agent->>Edge: GET /api/customers/{id}
    Edge->>Vault: GET /internal/customers/{id}
    Vault->>DB: ciphertext columns
    Vault->>Vault: AES-GCM decrypt
    Vault-->>Edge: CustomerRecord full PII
    Edge->>Edge: PiiMasking mask fields
    Edge->>Audit: POST pii-access event
    Edge-->>Agent: masked JSON`;

const FULL_PII_GATE = `sequenceDiagram
    autonumber
    actor Support as Support agent
    actor Admin as PII admin
    participant Edge as support-api
    participant Audit as audit-service

    Support->>Edge: GET ?fullPii=true
    Edge-->>Support: 403 ROLE_PII_ADMIN required
    Admin->>Edge: GET ?fullPii=true
    Edge->>Audit: fullPiiGranted=true
    Edge-->>Admin: 200 unmasked SSN/email`;

const SECRETS_FLOW = `flowchart LR
    Vault[Secrets Manager] --> K8s[K8s Secret]
    K8s --> ENV[env inject]
    ENV --> CS[customer-service]
    ENV --> SA[support-api]
    CS --> ENC[AesGcm converter]`;

const diagrams = [
  {
    id: 'microservices',
    title: 'Three-service PII architecture',
    blurb: 'Agents hit support-api only; customer-service is internal; audit-service is compliance.',
    chart: MICROSERVICES,
  },
  {
    id: 'pii-read',
    title: 'End-to-end masked read',
    blurb: 'Vault decrypts; BFF masks; audit records actor + IP.',
    chart: PII_READ,
  },
  {
    id: 'full-pii-gate',
    title: 'Full PII gate at support-api',
    blurb: 'Support gets 403 on ?fullPii=true; admin path is audited.',
    chart: FULL_PII_GATE,
  },
  {
    id: 'secrets-flow',
    title: 'Secrets injection',
    blurb: 'Same env pattern on every pod — never in application.yml values.',
    chart: SECRETS_FLOW,
  },
] as const;

export default function SpringSecretsPiiSequenceDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="secrets-pii-flows-heading">
      <h2 id="secrets-pii-flows-heading" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Sequence & box diagrams
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        support-api + customer-service + audit-service — full microservices PII flow.
      </p>
      <div className="mt-8 space-y-12">
        {diagrams.map((d) => (
          <article key={d.id} id={d.id} className="scroll-mt-24">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{d.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d.blurb}</p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <Mermaid chart={d.chart} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
