'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import CodePanel from '@/components/hub-code-panel';
import {CHEAT_SHEET, COMPARISON_TABLES} from '@/lib/aws-interview/comparison';
import {MEMORY_DIAGRAMS} from '@/lib/aws-interview/memory-diagrams';
import {INTERVIEW_QA, QUESTION_BANK_COUNTS} from '@/lib/aws-interview/question-bank';
import {AWS_TOC} from '@/lib/aws-interview/toc';
import {INTERVIEW_FIVE_MIN, INTERVIEW_SIXTY_SEC, TOPICS, VERSION_NOTE} from '@/lib/aws-interview/topics';
import AwsMemoryDiagramsSection from './memory-diagrams-section';
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

export default function AwsInterviewHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Senior · SDE3 · Staff · Architect · Java · Spring Boot · AWS · FinTech
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          AWS Interview Preparation Hub
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          VPC → IAM → EC2/ECS/EKS/Lambda → RDS/Aurora/DynamoDB → MSK → KMS → CloudWatch — diagram-first, ~70%
          CLI/config/code for Staff-level system design and production troubleshooting.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-500">{VERSION_NOTE}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a href="#memory-diagrams" className="font-semibold text-orange-700 hover:underline dark:text-orange-400">
            {MEMORY_DIAGRAMS.length} memory diagrams →
          </a>
          <a href="#cheat-sheet" className="font-semibold text-orange-700 hover:underline dark:text-orange-400">
            Cheat sheet →
          </a>
          <a href="#revision-path" className="font-semibold text-orange-700 hover:underline dark:text-orange-400">
            45-min path →
          </a>
          <Link href="/cost-optimization" className="font-semibold text-orange-700 hover:underline dark:text-orange-400">
            Cost optimization →
          </Link>
        </div>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={AWS_TOC} />
        <div className="min-w-0 space-y-8">
          <Section
            id="master-map"
            title="AWS master map"
            lead="One whiteboard: DNS edge → compute in private VPC → data + messaging + security + observability."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  R53[Route 53] --> WAF[WAF + Shield]
  WAF --> ALB[ALB ACM TLS]
  ALB --> COMP[ECS / EKS / Lambda]
  subgraph VPC [VPC private subnets multi-AZ]
    COMP --> RDS[(Aurora / RDS)]
    COMP --> DDB[(DynamoDB)]
    COMP --> REDIS[(ElastiCache)]
    COMP --> MSK[MSK Kafka]
  end
  COMP --> KMS[KMS + Secrets Manager]
  COMP --> CW[CloudWatch + X-Ray + Trail]`}
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <CodePanel title="60-second interview opener" code={INTERVIEW_SIXTY_SEC} tone="neutral" />
              <CodePanel title="5-minute FinTech whiteboard" code={INTERVIEW_FIVE_MIN} tone="neutral" />
            </div>
          </Section>

          <Section
            id="memory-diagrams"
            title="Memory diagrams — maximum visual recall"
            lead={`${MEMORY_DIAGRAMS.length} whiteboard diagrams across 11 groups — VPC, IAM, compute, data, messaging, security, DR, comparisons, and 7 troubleshooting flows.`}
          >
            <AwsMemoryDiagramsSection />
          </Section>

          <Section id="cheat-sheet" title="Comparison cheat sheet" lead="Final interview tables — EC2 vs Lambda, ALB vs NLB, SQS vs Kafka, RDS vs DynamoDB, DR strategies.">
            <MiniTable headers={['Term', 'Remember']} rows={CHEAT_SHEET} />
            <div className="mt-8 space-y-6">
              {COMPARISON_TABLES.map((t) => (
                <div key={t.title}>
                  <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{t.title}</h3>
                  <MiniTable headers={t.headers} rows={t.rows} />
                </div>
              ))}
            </div>
          </Section>

          <Section id="revision-path" title="45-minute revision path (before interview)">
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <li>
                Draw <a href="#memory-vpc-full-architecture" className="font-semibold text-orange-700">VPC architecture</a> from
                memory — IGW, NAT, public/private, SG.
              </li>
              <li>
                <a href="#iam" className="font-semibold text-orange-700">IAM</a> — role vs user, STS flow, task role for ECS.
              </li>
              <li>
                Pick compute: <a href="#memory-compute-picker" className="font-semibold text-orange-700">EC2 vs ECS vs EKS vs Lambda</a>.
              </li>
              <li>
                <a href="#rds" className="font-semibold text-orange-700">RDS</a> Multi-AZ vs Read Replica +{' '}
                <a href="#dynamodb" className="font-semibold text-orange-700">DynamoDB</a> hot partition fix.
              </li>
              <li>
                <a href="#sqs-sns-eventbridge" className="font-semibold text-orange-700">SQS</a> visibility + DLQ vs{' '}
                <a href="#msk-kafka" className="font-semibold text-orange-700">MSK</a>.
              </li>
              <li>
                <a href="#kms" className="font-semibold text-orange-700">KMS</a> envelope +{' '}
                <a href="#secrets-manager" className="font-semibold text-orange-700">Secrets Manager</a> rotation.
              </li>
              <li>
                <a href="#system-design" className="font-semibold text-orange-700">Payment system design</a> +{' '}
                <a href="#disaster-recovery" className="font-semibold text-orange-700">DR RPO/RTO</a>.
              </li>
              <li>
                Skim <a href="#troubleshooting" className="font-semibold text-orange-700">troubleshooting</a> — ALB 503, S3 denied,
                Kafka lag.
              </li>
            </ol>
          </Section>

          <Section
            id="question-bank"
            title="Interview question bank"
            lead={`Starter bank with ⭐ MOST ASKED · 🔥 SENIOR · 🏆 STAFF tags. Targets: ${QUESTION_BANK_COUNTS.Beginner.target} beginner · ${QUESTION_BANK_COUNTS.Intermediate.target} intermediate · ${QUESTION_BANK_COUNTS.Senior.target} senior · ${QUESTION_BANK_COUNTS.Staff.target} staff.`}
          >
            <div className="space-y-4">
              {INTERVIEW_QA.map((q) => (
                <details
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <summary className="cursor-pointer text-base font-bold text-slate-900 dark:text-white">
                    {q.tag && <span className="mr-2">{q.tag}</span>}
                    {q.question}
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      ({q.level} · {q.topic})
                    </span>
                  </summary>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <p>
                      <strong>30s:</strong> {q.answer30s}
                    </p>
                    <p>
                      <strong>2m:</strong> {q.answer2m}
                    </p>
                    {q.production && (
                      <p>
                        <strong>Production:</strong> {q.production}
                      </p>
                    )}
                    {q.mistake && (
                      <p className="rounded-lg bg-rose-50 p-3 text-rose-950 dark:bg-rose-950/30 dark:text-rose-100">
                        <strong>Common mistake:</strong> {q.mistake}
                      </p>
                    )}
                    <p>
                      <strong>Follow-ups:</strong> {q.followUps.join(' · ')}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section id="topics" title="All AWS topics" lead={`${TOPICS.length} topics — expand for CLI, Terraform, Java/Spring config, verify commands, and interview answers.`}>
            <div className="space-y-4">
              {TOPICS.map((t) => (
                <TopicPanel key={t.id} t={t} />
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
