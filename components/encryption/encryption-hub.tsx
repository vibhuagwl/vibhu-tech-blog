'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';
import {ENCRYPTION_TOC} from '@/lib/encryption/toc';
import {TOPICS} from '@/lib/encryption/topics';
import {
  AES_RSA_ECC_TABLE,
  ALGORITHM_CATALOGUE,
  ARCHITECT_MEMORY,
  CHEAT,
  CHECKLIST,
  CLOSING,
  DECISION_MATRIX,
  FIVE_MIN,
  MEMORY_SENTENCE,
  SIXTY_SEC,
} from '@/lib/encryption/comparison';
import {FIVE_ROOMS_SENTENCE} from '@/lib/encryption/famous-algorithms';
import {PKI_SENTENCE} from '@/lib/encryption/pki';
import {PRODUCTION_MISTAKES} from '@/lib/encryption/mistakes';
import AlgorithmClassroom from './algorithm-classroom';
import CodePanel from './code-panel';
import PkiClassroom from './pki-classroom';
import InterviewMode from './interview-mode';
import SequenceWalkthrough, {LabCallMap} from './sequence-walkthrough';
import StickyToc from './sticky-toc';
import TopicPanel from './topic-panel';

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MiniTable({headers, rows}: {headers: string[]; rows: string[][]}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join('|')} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c, i) => (
                <td key={i} className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold' : ''}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EncryptionHub({
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
          Staff · Principal · Architect · Java · Spring Boot 3 · KMS · Payments
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Encryption Algorithms — Five Rooms, PKI, Internals, Java
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Too many algorithm names? Memorize five rooms — LOCK, SEAL, KEY, PRINT, PIPE — then
          pick one famous default per room. PKI is the framework that binds a name to a key so
          those rooms work between strangers. Internals, Java, and pros/cons live in the
          classrooms below. Deep dives stay collapsed until you need them.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {FIVE_ROOMS_SENTENCE}
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">{MEMORY_SENTENCE}</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">{PKI_SENTENCE}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Lab:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">spring-encryption-lab/</code>
          {' · '}
          <Link href="/spring-security" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Spring Security
          </Link>
          {' · '}
          <Link href="/resilience4j" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Resilience4j
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={ENCRYPTION_TOC} />
        <div className="min-w-0 space-y-5">
          <Section
            id="overview"
            title="Big Picture — Payment Data Protection"
            lead="Crypto is a set of controls around data lifecycle: browser to API, service to service, database, Kafka, logs, partners, keys, rotation, and incident response."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                <Mermaid
                  chart={`flowchart TD
  PAN[Raw PAN/PII] --> LOG[debug logs]
  PAN --> DB[(plain DB column)]
  PAN --> JWT[JWT claim]
  PAN --> KAFKA[plain Kafka event]
  LOG --> BREACH[Breach blast radius]
  DB --> BREACH
  JWT --> BREACH
  KAFKA --> BREACH`}
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <Mermaid
                  chart={`flowchart TD
  REQ[TLS request] --> AUTH[JWT verify]
  AUTH --> TOK[Tokenize PAN]
  AUTH --> AES[AES-GCM PII]
  AES --> DB[(keyId|iv|ciphertext)]
  AUTH --> HMAC[HMAC callbacks]
  AES --> KMS[KMS envelope keys]
  KMS --> ROT[rotation runbook]`}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Production rule of thumb"
                code={`Do not start with "which algorithm?"

Start with:
1. What asset? PAN, SSN, password, JWT, webhook?
2. What attacker? DB dump, network MITM, log reader, partner tamper?
3. What property? confidentiality, integrity, authenticity, password verify?
4. Who owns the key? KMS, tenant, partner, keystore?
5. How rotate and test it? keyId, fixtures, backfill, alerts?`}
              />
              <CodePanel
                title="Spring lab shape"
                code={`spring-encryption-lab/ on port 8093

com.vibhu.crypto.crypto.AesEncryptionService
com.vibhu.crypto.crypto.HybridEncryptionService
com.vibhu.crypto.kms.EnvelopeEncryptionService
com.vibhu.crypto.tenant.TenantEncryptionService
com.vibhu.crypto.crypto.EncryptedStringConverter
com.vibhu.crypto.crypto.HmacService
com.vibhu.crypto.crypto.RsaSignatureService
com.vibhu.crypto.pki.PkiService
com.vibhu.crypto.pki.PkiController
com.vibhu.crypto.config.RsaKeyConfig`}
                tone="ok"
              />
            </div>
          </Section>

          <Section
            id="famous-algorithms"
            title="Famous Algorithms — Five Rooms"
            lead="Do not memorize thirty names. Memorize the house. Click a room, then an algorithm: how it works inside, copy-paste Java, pros/cons, and a one-line memory trick."
          >
            <AlgorithmClassroom />
          </Section>

          <Section
            id="pki"
            title="PKI — Certificates, CAs, and Trust"
            lead="PKI is a framework of cryptographic technologies, digital certificates, certificate authorities, and trust mechanisms. It establishes identity, enables secure communication, and provides authentication, encryption, and digital signatures. Click a building block or an outcome, then internals / Java / pros-cons."
          >
            <PkiClassroom />
          </Section>

          <Section
            id="code-sequences"
            title="End-to-End Sequence Diagrams — How the Lab Code Runs"
            lead="Read these before the topic cards. Each diagram is the actual Spring Boot path: HTTP request → controller → crypto service → JCE/KMS-shaped helper → response. Click a flow, then open the matching class in the lab explorer."
          >
            <SequenceWalkthrough />
            <div className="mt-6">
              <LabCallMap />
            </div>
          </Section>

          <Section
            id="decision-table"
            title="Decision Matrix Table"
            lead="The detailed topic below explains the matrix; this table is the quick interview answer."
          >
            <MiniTable
              headers={['Need', 'Primitive', 'Format', 'Production note']}
              rows={DECISION_MATRIX.map((r) => [r.need, r.primitive, r.format, r.note])}
            />
          </Section>

          <div id="deep-dives" className="scroll-mt-28">
            <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
              Deep dives
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Production topics from the original guide. Cards start closed so the famous-algorithm
              classroom stays the map. Open one when you need Spring/KMS/JWT detail.
            </p>
          </div>

          {TOPICS.map((t) => (
            <TopicPanel key={t.id} t={t} />
          ))}

          <Section id="algorithm-table" title="AES vs RSA vs ECC">
            <MiniTable
              headers={['Algorithm', 'Key model', 'Best use', 'Avoid']}
              rows={AES_RSA_ECC_TABLE.map((r) => [r.algorithm, r.key, r.best, r.avoid])}
            />
            <div className="mt-4">
              <MiniTable
                headers={['Status', 'Algorithm / pattern', 'Reason']}
                rows={ALGORITHM_CATALOGUE.map((r) => [r.status, r.item, r.reason])}
              />
            </div>
          </Section>

          <Section id="architect-memory" title="Architect Memory Sentences">
            <div className="grid gap-2 md:grid-cols-2">
              {ARCHITECT_MEMORY.map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
                  <span className="font-bold">{k}</span> → {v}
                </div>
              ))}
            </div>
          </Section>

          <Section id="interview" title="Interview Mode">
            <InterviewMode />
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">60-second answer</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{SIXTY_SEC}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">5-minute architect answer</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{FIVE_MIN}</p>
              </div>
            </div>
          </Section>

          <Section
            id="lab"
            title="Runnable Lab"
            lead="Spring Boot crypto lab on port 8093 with AES-GCM, keyId|iv|ciphertext, hybrid encryption, signatures, HMAC, and encrypted JPA fields."
          >
            <CodePanel
              title="Quick start + curl"
              code={`cd spring-encryption-lab
mvn test
mvn spring-boot:run   # :8093

curl -sS -X POST http://127.0.0.1:8093/api/crypto/encrypt \\
  -H 'Content-Type: application/json' \\
  -d '{"plaintext":"customer-tax-id-1234"}'

curl -sS -X POST http://127.0.0.1:8093/api/crypto/decrypt \\
  -H 'Content-Type: application/json' \\
  -d '{"ciphertext":"local-v1|..."}'

curl -sS -X POST http://127.0.0.1:8093/api/customers \\
  -H 'Content-Type: application/json' \\
  -d '{"id":"c1","email":"a@example.com","taxIdentifier":"123-45-6789"}'`}
            />
            {files.length > 0 && (
              <div className="mt-6">
                <OAuthCodeExplorer
                  files={files}
                  tree={tree}
                  defaultPath={defaultPath}
                  routeBase="/encryption"
                  ariaLabel="Spring encryption lab source tree"
                />
              </div>
            )}
          </Section>

          <Section id="checklist" title="Production Checklist">
            <ul className="grid gap-2 md:grid-cols-2">
              {CHECKLIST.map((item) => (
                <li key={item} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
                  [ ] {item}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <MiniTable
                headers={['Bad', 'Good', 'Why']}
                rows={PRODUCTION_MISTAKES.map((r) => [r.bad, r.good, r.why])}
              />
            </div>
          </Section>

          <Section id="cheat-sheet" title="Cheat Sheet">
            <div className="grid gap-2 md:grid-cols-2">
              {CHEAT.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-bold">{k}</div>
                  <div className="text-slate-500">{v}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-3xl text-base font-semibold leading-7 text-slate-800 dark:text-slate-200">
              {CLOSING}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
