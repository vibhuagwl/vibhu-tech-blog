import Link from 'next/link';
import {getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';

export const metadata={title:'Real-Time Issues — Production Incidents'};

const ORDER=[
  'realtime-issues-master-index',
  'stuck-thread-incident-response',
  'stuck-thread-jvm-thread-dumps',
  'stuck-thread-db-api-pools',
  'stuck-thread-spring-kafka-locks',
  'stuck-thread-cpu-gc-kill-restart',
  'stuck-thread-rca-prevention-observability',
  'stuck-thread-payment-incident-case-study',
  'stuck-thread-interview-answer-and-followups',
  'stuck-thread-cheat-sheet',
  'process-10gb-file-master-index',
  'process-10gb-streaming-nio-mmap',
  'process-10gb-parallel-chunks',
  'process-10gb-database-spring-batch',
  'process-10gb-checkpoint-idempotency',
  'process-10gb-formats-cloud-distributed',
  'process-10gb-backpressure-observability',
  'process-10gb-interview-answer-and-followups',
  'java-30yoe-interview-master-index',
  'java-30yoe-production-incidents-qa',
  'java-30yoe-concurrency-qa',
  'java-30yoe-jvm-gc-performance-qa',
  'java-30yoe-spring-microservices-qa',
  'java-30yoe-kafka-database-qa',
  'java-30yoe-distributed-caching-migration-qa',
  'java-30yoe-architecture-code-qa',
  'api-integration-frameworks-master-index',
  'api-design-contracts-rest',
  'api-integration-patterns',
  'api-versioning-compatibility',
  'api-authn-authz-security',
  'api-error-handling-resilience',
  'api-service-to-service-communication',
  'api-integration-interview-answer-and-followups',
  'aurora-postgresql-master-index',
  'aurora-postgresql-sql-and-architecture',
  'aurora-postgresql-query-tuning-indexes',
  'aurora-postgresql-vacuum-locks-pools',
  'aurora-postgresql-cloudwatch-writer-reader',
  'aurora-postgresql-transactions-migrations',
  'aurora-postgresql-incident-case-study',
  'aurora-postgresql-interview-answer-and-followups',
  'lead-experience-master-index',
  'lead-experience-delivery-ownership',
  'lead-experience-engineering-standards',
  'lead-experience-unblocking-mentoring',
  'lead-experience-release-hands-on',
  'lead-experience-payment-case-study',
  'lead-experience-interview-answer-and-followups',
  'java-migration-master-index',
  'java-migration-lifecycle-and-baseline',
  'java-migration-compatibility-and-spring',
  'java-migration-dependencies-and-build',
  'java-migration-testing-and-regression',
  'java-migration-rollout-and-rollback',
  'java-migration-interview-answer-and-followups',
  'java-migration-production-runbook',
  'java-migration-before-prod-checklist',
  'oracle-database-realtime-troubleshooting',
  'oracle-database-incident-case-study',
  'query-used-to-be-fast-now-timeouts',
  'production-database-change-risk-checklist',
  'spring-secrets-pii-handling',
  'spring-kafka-dlq-payments',
];

export default function RealtimeIssues(){
  const posts=getPostsByCategories([...SECTION_CATEGORIES['realtime-issues']]);
  const bySlug=new Map(posts.map((p)=>[p.slug,p]));
  const ordered=ORDER.map((s)=>bySlug.get(s)).filter(Boolean) as typeof posts;
  const rest=posts.filter((p)=>!ORDER.includes(p.slug));
  const list=[...ordered,...rest];
  const index=bySlug.get('realtime-issues-master-index');

  return (
    <main>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.04)] md:p-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-black uppercase tracking-[.16em] text-slate-600">Staff+ · Principal · Architect</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">Real-time production issues — diagnose like you were on-call.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Incident playbooks for Java/Spring Boot: stuck threads, multi‑GB files, 30 YOE interview bank,
          <strong>API Integration &amp; Frameworks</strong>, <strong>Aurora PostgreSQL</strong>,{' '}
          <strong>Lead Experience</strong>, and <strong>Java migration</strong> (honest Java 11→17 upgrade framing).
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{posts.length} guides</span>
          {index && (
            <Link href={`/realtime-issues/${index.slug}`} className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
              Start with the index →
            </Link>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-black">All topics</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {list.map((p)=>(
            <Link key={p.slug} href={`/realtime-issues/${p.slug}`} className="card p-6 transition hover:-translate-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">{p.difficulty} · {p.readingTime}</div>
              <h3 className="mt-3 text-xl font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{p.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
