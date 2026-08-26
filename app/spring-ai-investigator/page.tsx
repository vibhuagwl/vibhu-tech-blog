import type {Metadata} from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Spring AI Payment Investigator — Context + Harness Engineering',
  description:
    'Runnable Spring AI lab: Context Engineering, AiExecutionHarness, ToolGateway, RAG, MCP, Kafka, HITL. Investigate TXN-1001 / BEN-001.',
};

const FLOW = `User: Why did payment TXN-1001 fail?
  → AI Gateway (auth)
  → Context Engineering (budgeted, provenanced)
  → AiExecutionHarness (state machine)
  → Tools via ToolGateway (never DB/Kafka direct)
  → RAG policy BEN-001
  → Structured PaymentInvestigation + Java validation
  → Audit / metrics
  → Response (no financial execute)`;

export default function SpringAiInvestigatorPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
        Context Engineering · Harness Engineering · Tools · MCP
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
        Spring AI Payment Investigator
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
        Production-shaped lab that separates <strong>what the model sees</strong> (Context Engineering) from{' '}
        <strong>what controls the model</strong> (Harness Engineering). Seed scenario: TXN-1001 / BEN-001 / 3 retries.
        AI never owns money, authZ, or DB truth — Java does.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link
          href="/spring-ai-investigator-demo"
          className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
        >
          Browse full source
        </Link>
        <Link
          href="/spring-ai"
          className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-800 dark:border-slate-600 dark:text-slate-100"
        >
          Spring AI playbook
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Investigation path</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-100">
          {FLOW}
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Run locally</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-100">{`cd spring-ai-payment-investigator
mvn test
mvn -pl ai-orchestrator spring-boot:run   # :8090

curl -s -X POST http://localhost:8090/api/ai/chat \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer demo' \\
  -d '{"conversationId":"c1","message":"Why did payment TXN-1001 fail?"}'`}</pre>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          GitHub Pages is static — it cannot run Spring Boot. Use the source explorer or clone to run.
        </p>
      </section>
    </main>
  );
}
