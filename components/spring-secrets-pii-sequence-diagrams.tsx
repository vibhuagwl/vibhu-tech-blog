'use client';

import Mermaid from '@/components/mermaid';

const SECRETS_FLOW = `flowchart LR
    subgraph Store["Never in git"]
      SM[AWS Secrets Manager / Vault]
      K8s[K8s Secret object]
    end
    subgraph Pod
      ENV[env: DB_PASSWORD<br/>PII_ENCRYPTION_KEY]
      APP[Spring Boot customer-service]
      DS[Hikari DataSource]
      ENC[AesGcmAttributeConverter]
    end
    SM --> K8s
    K8s --> ENV
    ENV --> APP
    APP --> DS
    APP --> ENC
    ENC --> DB[(Postgres ciphertext columns)]`;

const PII_READ = `sequenceDiagram
    autonumber
    actor Agent as Support agent
    participant API as CustomerController
    participant Svc as CustomerService
    participant JPA as Hibernate + Converter
    participant DB as Postgres
    participant Audit as PiiAccessAuditAspect
    participant Log as PII_AUDIT / masked app log

    Agent->>API: GET /customers/{id} Basic auth
    API->>Svc: get(id, fullPii=false)
    Svc->>JPA: findById
    JPA->>DB: SELECT ciphertext
    DB-->>JPA: encrypted email/ssn
    JPA->>JPA: AesGcm decrypt in converter
    Svc->>Svc: PiiMasking mask email/ssn
    Svc->>Audit: afterReturning
    Audit->>Log: READ_CUSTOMER actor=support fullPii=false
    Svc-->>API: CustomerResponse masked=true
    API-->>Agent: 200 j***@bank.com ***-**-6789`;

const FULL_PII_GATE = `sequenceDiagram
    autonumber
    actor Admin as PII admin
    actor Support as Support user
    participant API as CustomerController
    participant Svc as CustomerService

    Support->>API: GET ?fullPii=true
    API->>Svc: get(id, true)
    Svc->>Svc: !hasRole PII_ADMIN
    Svc-->>API: PiiAccessDeniedException
    API-->>Support: 403 forbidden

    Admin->>API: GET ?fullPii=true
    API->>Svc: get(id, true)
    Svc->>Svc: ROLE_PII_ADMIN OK
    Svc-->>API: full email + ssn
    API-->>Admin: 200 unmasked + audit logged`;

const LOG_REDACT = `flowchart TD
    Dev[Developer log.info with password=xyz] --> LB[Logback PiiMaskingConverter]
    LB --> San[SecretSanitizer.redact]
    San --> Out[Console: password=[REDACTED]]
    Err[Accidental SSN in message] --> San
    San --> Out2[Console: ***-**-****]`;

const diagrams = [
  {
    id: 'secrets-flow',
    title: 'Secrets path — K8s / Vault → env → Spring (never in application.yml)',
    blurb: 'Same pattern for DB password, Kafka SASL, OAuth client_secret, and PII encryption key.',
    chart: SECRETS_FLOW,
  },
  {
    id: 'pii-read',
    title: 'PII read — encrypt at rest, mask in API, audit every access',
    blurb: 'Support sees masked fields; ciphertext in Postgres; decrypt only inside the JVM.',
    chart: PII_READ,
  },
  {
    id: 'full-pii-gate',
    title: 'Full PII gate — role check before unmasking',
    blurb: '?fullPii=true without ROLE_PII_ADMIN returns 403; admin access is audited.',
    chart: FULL_PII_GATE,
  },
  {
    id: 'log-redact',
    title: 'Log redaction — last line of defense',
    blurb: 'SecretSanitizer + Logback converter strip passwords, Bearer tokens, and SSN patterns.',
    chart: LOG_REDACT,
  },
] as const;

export default function SpringSecretsPiiSequenceDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="secrets-pii-flows-heading">
      <h2 id="secrets-pii-flows-heading" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Sequence & box diagrams
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        customer-service — secrets injection and PII handling flows.
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
