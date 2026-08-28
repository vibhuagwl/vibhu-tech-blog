'use client';

import Link from 'next/link';
import {
  KAFKA_PRODUCTION_TOC,
  MEMORY_SENTENCE,
  VERSION_NOTE,
  ARCHITECTURE_ASCII,
  LISTENERS_EXPLAIN,
  SECURITY_COMPARISON,
  SECURITY_FLOW_STEPS,
  FAILURE_SCENARIOS,
  PRODUCTION_CHECKLIST,
} from '@/lib/kafka-production/content';
import StickyToc from '@/components/kafka-infra/sticky-toc';
import CodePanel from '@/components/kafka-infra/code-panel';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';

function Section({id, title, lead, children}: {id: string; title: string; lead?: string; children: React.ReactNode}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Pre({children}: {children: string}) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-[12px] leading-5 text-slate-100 dark:border-slate-800">
      {children.trim()}
    </pre>
  );
}

function MiniTable({headers, rows}: {headers: string[]; rows: string[][]}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join('|')} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c, i) => (
                <td key={i} className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const BROKER_SNIPPET = `# kafka-production/kafka/broker.properties (excerpt)
listeners=CLIENT://0.0.0.0:9093,BROKER://0.0.0.0:9094,CONTROLLER://0.0.0.0:9095
listener.security.protocol.map=CLIENT:SASL_SSL,BROKER:SSL,CONTROLLER:SSL
default.replication.factor=3
min.insync.replicas=2
unclean.leader.election.enable=false
authorizer.class.name=org.apache.kafka.metadata.authorizer.StandardAuthorizer
allow.everyone.if.no.acl.found=false`;

const PRODUCER_YML = `# kafka-production/producer/application-prod.yml
spring:
  kafka:
    bootstrap-servers: kafka1.internal:9093,kafka2.internal:9093,kafka3.internal:9093
    properties:
      security.protocol: SASL_SSL
      sasl.mechanism: SCRAM-SHA-512
      sasl.jaas.config: org.apache.kafka.common.security.scram.ScramLoginModule required username="payment-producer" password="\${KAFKA_SCRAM_PASSWORD}";
      ssl.truststore.location: /etc/kafka/secrets/truststore.jks
      ssl.truststore.password: \${KAFKA_TRUSTSTORE_PASSWORD}
    producer:
      acks: all
      enable-idempotence: true
      retries: 10
      compression-type: lz4`;

const CONSUMER_YML = `# kafka-production/consumer/application-prod.yml
spring:
  kafka:
    consumer:
      group-id: payment-group
      enable-auto-commit: false
      isolation-level: read_committed
    listener:
      ack-mode: manual`;

const ACL_SNIPPET = `# kafka-production/acl/producer-acls.sh
kafka-acls --bootstrap-server $BOOT --command-config admin.properties \\
  --add --allow-principal User:payment-producer \\
  --operation Write --operation IdempotentWrite --topic payment-events

# Consumer needs BOTH:
kafka-acls --add --allow-principal User:payment-consumer \\
  --operation Read --topic payment-events
kafka-acls --add --allow-principal User:payment-consumer \\
  --operation Read --group payment-group`;

export default function KafkaProductionHub({
  files = [],
  tree = [],
  defaultPath = '',
}: {
  files?: DemoSourceFile[];
  tree?: DemoTreeNode[];
  defaultPath?: string;
}) {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          FinTech Production · Kafka Platform Engineering
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Kafka Production Deployment & Security
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          End-to-end reference: Producer → TLS/SASL → Brokers (KRaft, 3 AZ) → ACL → Consumer Groups.
          Runnable configs in <code className="text-sm">kafka-production/</code> — no secrets in Git.
        </p>
        <p className="mt-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">{MEMORY_SENTENCE}</p>
        <p className="mt-3 text-sm text-slate-500">{VERSION_NOTE}</p>
        <p className="mt-3 text-sm text-slate-500">
          Related:{' '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">Kafka Interview</Link>
          {' · '}
          <Link href="/kafka-infra" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">Infra / War Room</Link>
          {' · '}
          <Link href="/spring-security#kafka-security" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">Spring Security Kafka</Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_1fr]">
        <StickyToc items={KAFKA_PRODUCTION_TOC} />
        <div className="min-w-0 space-y-16">
          <Section id="overview" title="00. Overview · architecture" lead="Producer → Broker → Consumer with encryption and auth at every hop.">
            <Pre>{ARCHITECTURE_ASCII}</Pre>
          </Section>

          <Section id="deployment" title="01. KRaft deployment · listeners" lead="3 brokers across 3 AZs; separate CLIENT, BROKER, CONTROLLER listeners.">
            <Pre>{LISTENERS_EXPLAIN}</Pre>
            <div className="mt-4"><CodePanel title="broker.properties (production excerpt)" code={BROKER_SNIPPET} /></div>
          </Section>

          <Section id="tls" title="02. TLS · mTLS · certificates" lead="TLS 1.2+ on all listeners. Keystore = own cert+key; Truststore = CA.">
            <MiniTable
              headers={['Artifact', 'Contains', 'Used for']}
              rows={[
                ['Keystore (.jks)', 'Private key + certificate', 'Broker server, mTLS client'],
                ['Truststore (.jks)', 'CA certificates', 'Validate peer cert'],
                ['CA cert', 'Root of trust', 'Sign broker and client certs'],
              ]}
            />
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Generate with <code className="text-xs">security/openssl/generate-certs.sh</code> — passwords from env only.
              mTLS: <code className="text-xs">ssl.client.auth=required</code> on broker.
            </p>
          </Section>

          <Section id="auth" title="03. Authentication · SASL" lead="Authentication = who are you? FinTech: SASL_SSL + SCRAM-SHA-512 per service.">
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              Create users via <code className="text-xs">kafka-configs --alter --add-config SCRAM-SHA-512</code>.
              Separate identities: payment-producer, payment-consumer, order-producer, reporting-consumer, admin.
            </p>
          </Section>

          <Section id="acl" title="04. Authorization · ACLs" lead="Authorization = what are you allowed to do? Least privilege — apps never get CLUSTER_ACTION.">
            <CodePanel title="ACL examples" code={ACL_SNIPPET} />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Consumer needs <strong>READ on topic</strong> AND <strong>READ on consumer group</strong> — topic alone is insufficient.
            </p>
          </Section>

          <Section id="producer" title="05. Producer security" lead="acks=all · idempotence · SASL_SSL · compression · bounded retries.">
            <CodePanel title="Spring producer application-prod.yml" code={PRODUCER_YML} />
          </Section>

          <Section id="consumer" title="06. Consumer security" lead="Manual ack · read_committed · group ACL · max.poll tuning.">
            <CodePanel title="Spring consumer application-prod.yml" code={CONSUMER_YML} />
          </Section>

          <Section id="secrets" title="07. Secrets management" lead="Never store passwords, keys, or cert passwords in Git.">
            <Pre>{`AWS Secrets Manager / Vault / K8s Secret
        ↓ mount volume or env inject
   Spring Boot application.yml \${KAFKA_SCRAM_PASSWORD}
        ↓
   Kafka client JAAS + truststore

Rotate: update secret → rolling pod restart → verify auth metrics`}
            </Pre>
          </Section>

          <Section id="network" title="08. Network security" lead="Kafka in private subnets only — no public internet access.">
            <Pre>{`Internet ──X──► Kafka

App VPC (private) ──security group──► Kafka subnet :9093 only
NetworkPolicy: allow payment-platform namespace → kafka:9093`}
            </Pre>
          </Section>

          <Section id="topics" title="09. Topic design · durability" lead="RF=3, minISR=2, partition by business key.">
            <MiniTable
              headers={['Topic', 'Partitions', 'Key', 'Retention']}
              rows={[
                ['payment-events', '12', 'paymentId', '7d'],
                ['order-events', '12', 'orderId', '7d'],
                ['transaction-events', '24', 'txnId', '30d'],
                ['audit-events', '6', 'eventId', '90d'],
              ]}
            />
          </Section>

          <Section id="eos" title="10. Idempotence · EOS" lead="Idempotent producer prevents dup on retry; consumer dedupe for at-least-once.">
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              <code className="text-xs">enable.idempotence=true</code> + <code className="text-xs">acks=all</code> + consumer dedupe table.
              Full EOS (transactions + read_committed) for consume-transform-produce — higher cost; outbox + idempotent consumer often sufficient for payments.
            </p>
          </Section>

          <Section id="failures" title="11. Failure scenarios" lead="What breaks and which pattern handles it.">
            <MiniTable headers={['Scenario', 'Handling']} rows={FAILURE_SCENARIOS.map((f) => [f.scenario, f.handling])} />
          </Section>

          <Section id="dr" title="12. Disaster recovery" lead="Active-passive with MirrorMaker 2 — explicit failover runbook.">
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              Primary us-east-1 → MM2 → DR us-west-2. Failover: stop primary producers, verify lag, switch bootstrap DNS, reset/migrate consumer offsets, reconciliation job.
            </p>
          </Section>

          <Section id="monitoring" title="13. Monitoring · alerts" lead="URP, offline partitions, lag, disk, cert expiry, auth failures.">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              See <code className="text-xs">monitoring/prometheus/alerts.yml</code> in repo. Page on URP &gt; 0, offline partitions, active controller ≠ 1.
            </p>
          </Section>

          <Section id="k8s" title="14. Kubernetes deployment" lead="StatefulSet · PDB minAvailable=2 · pod anti-affinity across AZ · encrypted PVC.">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Manifests in <code className="text-xs">kubernetes/kafka-statefulset.yaml</code> and <code className="text-xs">network-policy.yaml</code>.
            </p>
          </Section>

          <Section id="security-flow" title="15. Security flow (18 steps)" lead="From producer start to offset commit.">
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {SECURITY_FLOW_STEPS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </Section>

          <Section id="comparison" title="16. Security comparison" lead="FinTech recommendation: SASL_SSL + SCRAM + ACL.">
            <MiniTable headers={SECURITY_COMPARISON.headers} rows={SECURITY_COMPARISON.rows} />
          </Section>

          <Section id="repo" title="17. Config repository explorer" lead="Browse kafka-production/ — broker configs, ACL scripts, Spring yml, K8s, docs.">
            {files.length > 0 ? (
              <OAuthCodeExplorer
                files={files}
                tree={tree}
                defaultPath={defaultPath}
                routeBase="/kafka-production"
                ariaLabel="Kafka production config repository"
              />
            ) : (
              <p className="text-sm text-slate-500">Clone repo to browse kafka-production/ locally.</p>
            )}
          </Section>

          <Section id="cheatsheet" title="18. Production checklist" lead="Pre-go-live and audit checklist.">
            <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {PRODUCTION_CHECKLIST.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
