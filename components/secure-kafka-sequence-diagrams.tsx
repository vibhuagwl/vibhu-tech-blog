'use client';

import Mermaid from '@/components/mermaid';

const E2E = `sequenceDiagram
    autonumber
    actor You as Caller
    participant API as Payment API HTTP
    participant Prod as PaymentProducer
    participant Okta
    participant Broker as Kafka Broker
    participant Cons as PaymentConsumer

    Note over You,API: ACT 1 — Who may call the API?
    You->>Okta: token A as payment-api
    Okta-->>You: JWT aud=payment-api
    You->>API: POST /api/payments + Bearer token A
    API->>API: Spring Security checks JWT + payment:write
    Note over Prod,Broker: Producer and broker are idle in this act.

    Note over Prod,Broker: ACT 2 — Who may write the topic?
    API->>Prod: send PaymentEvent
    Prod->>Okta: token B as payment-producer
    Okta-->>Prod: JWT aud=kafka
    Prod->>Broker: TLS handshake
    Prod->>Broker: SASL OAUTHBEARER token B
    Broker->>Broker: ACL WRITE User:payment-producer
    Broker-->>Prod: offset stored
    API-->>You: 202 ACCEPTED

    Note over Broker,Cons: ACT 3 — Who may read the topic?
    Cons->>Okta: token C as payment-consumer
    Cons->>Broker: TLS + SASL OAUTHBEARER token C
    Broker->>Broker: ACL READ topic AND group
    Broker-->>Cons: PaymentEvent`;

const PRODUCER = `sequenceDiagram
    autonumber
    participant Prod as PaymentProducer
    participant Okta
    participant Broker as Kafka Broker

    Note over Prod,Broker: Producer talks to the broker — not to Spring Security
    Prod->>Broker: TLS — is this the real broker?
    Prod->>Okta: token as payment-producer
    Okta-->>Prod: JWT aud=kafka
    Prod->>Broker: SASL — who am I?
    Broker->>Broker: ACL — may User:payment-producer WRITE payments?
    alt Allowed
        Broker-->>Prod: offset
    else Denied
        Broker-->>Prod: TopicAuthorizationException = 403
        Note over Prod: Do not send to DLT
    end`;

const CONSUMER = `sequenceDiagram
    autonumber
    participant Cons as PaymentConsumer
    participant Okta
    participant Broker as Kafka Broker

    Note over Cons,Broker: Consumer is a Kafka client. Same broker, different principal.
    Cons->>Okta: token as payment-consumer
    Cons->>Broker: TLS + SASL
    Broker->>Broker: ACL READ topic payments
    Broker->>Broker: ACL READ group payment-service
    alt Both ACLs present
        Broker-->>Cons: PaymentEvent
    else Missing group ACL
        Broker-->>Cons: GroupAuthorizationException
        Note over Cons: Topic READ is not enough. Do not DLT.
    end`;

const TWO_PLANES = `sequenceDiagram
    autonumber
    participant You as Caller
    participant API as Payment API HTTP
    participant Prod as PaymentProducer
    participant Broker as Kafka Broker
    participant Okta

    You->>Okta: token A — payment-api
    You->>API: Bearer token A
    Note over API: Spring Security resource server

    Prod->>Okta: token B — payment-producer
    Prod->>Broker: SASL with token B
    Note over Prod,Broker: Kafka clients. Not a filter chain.
    Note over You,Okta: Two tokens. Two audiences. Never send token A to the broker.`;

const FAIL = `flowchart TD
    A[Something failed] --> B{Socket up?}
    B -->|No| C[TLS fail<br/>SslAuthenticationException]
    B -->|Yes| D{JWT valid?}
    D -->|No| E[Authn fail<br/>SaslAuthenticationException = 401]
    D -->|Yes| F{ACL allow?}
    F -->|No| G[Authz fail<br/>Topic or GroupAuthorizationException = 403<br/>do not DLT]
    F -->|Yes| H{Payload ok?}
    H -->|No| I[Poison message → DLT]
    H -->|Yes| J[Success]`;

const diagrams = [
  {
    id: 'e2e',
    title: 'End to end — three questions',
    blurb: 'Boxes to find: PaymentProducer (client) and Kafka Broker (server). Token A never goes to the broker.',
    chart: E2E,
  },
  {
    id: 'producer',
    title: 'Producer — TLS, token, ACL, write',
    blurb: 'Four words. Missing WRITE is 403, not a bad message.',
    chart: PRODUCER,
  },
  {
    id: 'consumer',
    title: 'Consumer — topic ACL and group ACL',
    blurb: 'The trick question: READ on the topic does not let you join the group.',
    chart: CONSUMER,
  },
  {
    id: 'two-planes',
    title: 'Two tokens',
    blurb: 'HTTP = Spring Security. Kafka = SASL. Same Okta org, different authorization server.',
    chart: TWO_PLANES,
  },
  {
    id: 'fail',
    title: 'If they ask what failed',
    blurb: 'Walk the layers in order. Stop at the first no.',
    chart: FAIL,
  },
] as const;

export default function SecureKafkaSequenceDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="secure-kafka-flows-heading" id="diagrams">
      <h2 id="secure-kafka-flows-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        Interview flow — three acts
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Do not memorize every arrow. Remember <strong>three questions</strong>, then{' '}
        <strong>TLS → token → ACL</strong> on Kafka.
      </p>

      <div id="interview-flow" className="mt-6 scroll-mt-28 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">Say this in 20 seconds</p>
        <p className="mt-2 text-base leading-7 text-slate-800 dark:text-slate-100">
          “Caller gets an HTTP JWT for the API. The API then gets a <em>different</em> JWT for Kafka. Kafka
          checks TLS, then the JWT, then the ACL. Producer needs WRITE. Consumer needs READ on the topic{' '}
          <em>and</em> the group. Bad JWT is 401. Missing ACL is 403 — not a DLT.”
        </p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          <li className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
            <p className="font-mono text-[11px] font-bold text-slate-500">ACT 1</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">Who may call the API?</p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
              Token A · <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">aud=payment-api</code> · Spring
              Security · <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">payment:write</code>
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
            <p className="font-mono text-[11px] font-bold text-slate-500">ACT 2</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">Who may write the topic?</p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
              <strong>PaymentProducer</strong> → Okta for token B, then → <strong>Kafka Broker</strong>: TLS · SASL ·
              ACL WRITE <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">payments</code>
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
            <p className="font-mono text-[11px] font-bold text-slate-500">ACT 3</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">Who may read the topic?</p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
              <strong>PaymentConsumer</strong> → Okta for token C, then → <strong>Kafka Broker</strong>: ACL READ
              topic <em>and</em> group <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">payment-service</code>
            </p>
          </li>
        </ol>
      </div>

      <div className="mt-8 space-y-10">
        {diagrams.map((d) => (
          <div key={d.id} id={d.id} className="scroll-mt-28">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{d.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d.blurb}</p>
            <p className="mt-1 text-xs text-slate-500">
              {d.id === 'e2e' && (
                <a href="#seq-e2e" className="font-semibold text-slate-600 underline dark:text-slate-400">
                  Six numbered steps →
                </a>
              )}
              {d.id === 'producer' && (
                <a href="#seq-producer" className="font-semibold text-slate-600 underline dark:text-slate-400">
                  Four numbered steps →
                </a>
              )}
              {d.id === 'consumer' && (
                <a href="#seq-consumer" className="font-semibold text-slate-600 underline dark:text-slate-400">
                  Group-ACL steps →
                </a>
              )}
            </p>
            <Mermaid chart={d.chart} />
          </div>
        ))}
      </div>
    </section>
  );
}
