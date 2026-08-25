'use client';

import Link from 'next/link';
import CodePanel from '@/components/hub-code-panel';
import {CORE_RULE, SPRING_AI_TOC, VERSION_NOTE} from '@/lib/spring-ai/toc';
import {
  ADRS,
  ARCH_DIAGRAM,
  COMPONENT_ROLES,
  MISSION,
  MODULES,
  PHASES,
  PRODUCT_CAPS,
  TRADEOFFS,
} from '@/lib/spring-ai/architecture';
import {
  CHATCLIENT_CODE,
  FUNDAMENTALS_FLOW,
  MODEL_OPTIONS,
  PROMPTS,
  STRUCTURED_CODE,
  STRUCTURED_NOTES,
} from '@/lib/spring-ai/fundamentals';
import {
  MCP_SECURITY,
  MCP_SERVER,
  MCP_VS_REST_TABLE,
  MCP_WHY,
  TOOL_FLOW,
  TOOLS_CODE,
} from '@/lib/spring-ai/tools-mcp';
import {EMBEDDINGS, IN_MEMORY_VS, RAG_CODE, RAG_PIPELINE, VECTORSTORE_API} from '@/lib/spring-ai/rag';
import {ADVISORS, AGENT, GUARDRAILS, MEMORY} from '@/lib/spring-ai/agents';
import {
  AI_GATEWAY,
  APIS,
  CACHING_COST,
  DATA_MODEL,
  DEPLOY,
  DETERMINISTIC,
  DOCKER_SKETCH,
  EVENT_AI,
  HITL,
  INJECTION,
  KAFKA,
  MODEL_ROUTING,
  OBSERVABILITY,
  RESILIENCE,
  SECURITY_ARCH,
} from '@/lib/spring-ai/production';
import {RESPONSE_EXAMPLE, USECASE_PAYMENT, USECASE_PNL, USECASE_REVERSAL} from '@/lib/spring-ai/use-cases';
import {CHECKLIST, MISTAKES, MOCK_INTERVIEW, PERF, TESTING} from '@/lib/spring-ai/mistakes';
import StickyToc from './sticky-toc';
import {ConceptPacks, Interview100Browser} from './interview-browser';

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
      <div className="mt-6 space-y-4">{children}</div>
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
                <td
                  key={`${r[0]}-${i}`}
                  className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
                >
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

function Pre({children}: {children: string}) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[13px] leading-6 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
      {children}
    </pre>
  );
}

function Callout({tone, title, children}: {tone: 'rule' | 'warn' | 'ok'; title: string; children: string}) {
  const cls =
    tone === 'rule'
      ? 'border-slate-800 bg-slate-900 text-slate-100 dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900'
      : tone === 'warn'
        ? 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100'
        : 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100';
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm leading-7 ${cls}`}>
      <div className="text-[11px] font-bold uppercase tracking-[.12em] opacity-80">{title}</div>
      <p className="mt-1 whitespace-pre-wrap">{children}</p>
    </div>
  );
}

export default function SpringAiHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Principal · Spring AI · MCP · RAG · FinTech
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Spring AI Financial Intelligence Platform
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Staff/Principal interview mastery of production Spring AI — architecture, MCP, RAG, tools, agents,
          Kafka, security, human approval, and observability — not a toy chatbot.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{VERSION_NOTE}</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
          Related:{' '}
          <Link href="/fintech" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            FinTech
          </Link>
          {' · '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/spring-security" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Spring Security
          </Link>
          {' · '}
          <Link href="/resilience4j" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Resilience4j
          </Link>
          .
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-16">
          <Section id="mission" title="00. Mission & rules" lead="What this platform is for — and the non-negotiable boundary between AI and Java.">
            <Pre>{MISSION}</Pre>
            <Callout tone="rule" title="Core rule">
              {CORE_RULE}
            </Callout>
          </Section>

          <Section id="product" title="01. Product capabilities" lead="Natural-language trader questions that force tool selection, RAG, calc, and approvals.">
            <Pre>{PRODUCT_CAPS}</Pre>
          </Section>

          <Section id="architecture" title="02. Reference architecture" lead="Every box has an owner: identity at the edge, governance in the AI Gateway, money in domain services.">
            <Pre>{ARCH_DIAGRAM}</Pre>
            <MiniTable headers={['Component', 'Role']} rows={COMPONENT_ROLES} />
          </Section>

          <Section id="modules" title="03. Multi-module structure" lead="Maven layout you can defend in a design review.">
            <Pre>{MODULES}</Pre>
          </Section>

          <Section id="fundamentals" title="04. Spring AI fundamentals" lead="ChatClient → Prompt → ChatModel → provider — money still lives in Java.">
            <Pre>{FUNDAMENTALS_FLOW}</Pre>
            <Pre>{MODEL_OPTIONS}</Pre>
          </Section>

          <Section id="chatclient" title="05. ChatClient deep dive" lead="Sync for structured APIs; stream for long narrative UX.">
            <CodePanel title="ChatClient · Spring AI 1.0+" code={CHATCLIENT_CODE} language="java" />
          </Section>

          <Section id="prompts" title="06. Prompt architecture" lead="Versioned templates, budgets, and FinTech guardrails.">
            <Pre>{PROMPTS}</Pre>
          </Section>

          <Section id="structured" title="07. Structured output" lead="LLM → typed record → validation → business reconcile → approved result.">
            <CodePanel title="RiskAnalysis entity" code={STRUCTURED_CODE} language="java" />
            <Pre>{STRUCTURED_NOTES}</Pre>
          </Section>

          <Section id="tools" title="08. Tool calling" lead="Model plans; Java executes with authz on every call.">
            <Pre>{TOOL_FLOW}</Pre>
            <CodePanel title="@Tool portfolio & P&L" code={TOOLS_CODE} language="java" />
          </Section>

          <Section id="mcp" title="09. MCP deep dive" lead="Discoverable AI capabilities vs human REST APIs.">
            <Pre>{MCP_WHY}</Pre>
            <MiniTable headers={MCP_VS_REST_TABLE[0]} rows={MCP_VS_REST_TABLE.slice(1)} />
          </Section>

          <Section id="mcp-server" title="10. Financial MCP server" lead="Tools, resources, prompts — with schemas and discovery.">
            <Pre>{MCP_SERVER}</Pre>
          </Section>

          <Section id="mcp-security" title="11. MCP security" lead="Least privilege, anti-poisoning, propose-only money moves.">
            <Callout tone="warn" title="Never auto-execute transfers">
              {MCP_SECURITY}
            </Callout>
          </Section>

          <Section id="rag" title="12. RAG pipeline" lead="Policies and runbooks — never live balances or prices.">
            <Pre>{RAG_PIPELINE}</Pre>
            <CodePanel title="RAG ingest / search sketch" code={RAG_CODE} language="java" />
          </Section>

          <Section id="embeddings" title="13. Embeddings internals" lead="Why “payment failed” sits near “bank rejected” in vector space.">
            <Pre>{EMBEDDINGS}</Pre>
          </Section>

          <Section id="vector-memory" title="14. In-memory vector store" lead="Mandatory lab before pgvector / dedicated stores.">
            <Pre>{IN_MEMORY_VS}</Pre>
          </Section>

          <Section id="vectorstore" title="15. Spring AI VectorStore" lead="add / similaritySearch abstraction and migration path.">
            <CodePanel title="VectorStore API" code={VECTORSTORE_API} language="java" />
          </Section>

          <Section id="advisors" title="16. Advisors" lead="Security → PII → Memory → RAG around ChatClient.">
            <Pre>{ADVISORS}</Pre>
          </Section>

          <Section id="memory" title="17. Conversation memory" lead="TTL, summarization, tenant isolation — know when not to store.">
            <Pre>{MEMORY}</Pre>
          </Section>

          <Section id="agents" title="18. Controlled agents" lead="Observable tool traces, not hidden chain-of-thought.">
            <Pre>{AGENT}</Pre>
          </Section>

          <Section id="guardrails" title="19. Agent guardrails" lead="Read auto; write approve; budgets and circuit breakers.">
            <Pre>{GUARDRAILS}</Pre>
          </Section>

          <Section id="kafka" title="20. Real-time Kafka" lead="AI reads projections/caches — never raw bus dumps in prompts.">
            <Pre>{KAFKA}</Pre>
          </Section>

          <Section id="deterministic" title="21. Deterministic finance" lead="AI reasons; Java calculates P&L, risk, fees, exposure.">
            <Callout tone="ok" title="AI vs Java">
              {DETERMINISTIC}
            </Callout>
          </Section>

          <Section id="event-ai" title="22. Event-driven AI" lead="Async investigation for PaymentFailed and risk alerts.">
            <Pre>{EVENT_AI}</Pre>
          </Section>

          <Section id="hitl" title="23. Human-in-the-loop" lead="Maker-checker for reversals, restrictions, high-value actions.">
            <Pre>{HITL}</Pre>
          </Section>

          <Section id="injection" title="24. Prompt injection" lead="Direct, indirect, tool poisoning — defenses in advisors and allowlists.">
            <Pre>{INJECTION}</Pre>
          </Section>

          <Section id="security" title="25. Security architecture" lead="Gateway → JWT → orchestrator → tool gateway → MCP → services.">
            <Pre>{SECURITY_ARCH}</Pre>
          </Section>

          <Section id="observability" title="26. Observability" lead="Tokens, cost, tool latency, RAG latency, agent iterations.">
            <Pre>{OBSERVABILITY}</Pre>
          </Section>

          <Section id="resilience" title="27. Resilience" lead="Timeouts, CB, bulkheads, fallbacks when LLM or vector is down.">
            <Pre>{RESILIENCE}</Pre>
          </Section>

          <Section id="caching-cost" title="28. Caching · cost · routing" lead="Cache embeddings; never cache ledger truth inappropriately.">
            <Pre>{CACHING_COST}</Pre>
            <Pre>{MODEL_ROUTING}</Pre>
          </Section>

          <Section id="gateway" title="29. AI Gateway" lead="Stop every microservice from holding provider keys.">
            <Pre>{AI_GATEWAY}</Pre>
          </Section>

          <Section id="data-api" title="30. Data model · APIs" lead="Postgres truth, Redis hot path, Kafka streams, vector docs.">
            <Pre>{DATA_MODEL}</Pre>
            <Pre>{APIS}</Pre>
          </Section>

          <Section id="usecase-pnl" title="31. E2E: portfolio P&L" lead="Tools + Java calc + optional RAG → structured FinancialAnalysis.">
            <Pre>{USECASE_PNL}</Pre>
            <CodePanel title="Example structured response" code={RESPONSE_EXAMPLE} language="json" />
          </Section>

          <Section id="usecase-payment" title="32. E2E: payment failure" lead="Transaction tool + payment logs + policy RAG → root cause.">
            <Pre>{USECASE_PAYMENT}</Pre>
          </Section>

          <Section id="usecase-reversal" title="33. E2E: reversal + approval" lead="Why LLM must never execute ₹20L reverse alone.">
            <Pre>{USECASE_REVERSAL}</Pre>
          </Section>

          <Section id="testing" title="34. Testing · performance" lead="Mock ChatModel in CI; golden evals for injection and tool choice.">
            <Pre>{TESTING}</Pre>
            <Pre>{PERF}</Pre>
          </Section>

          <Section id="deploy" title="35. K8s deployment" lead="Stateless orchestrator/MCP; sessions in Redis; canary prompts.">
            <Pre>{DEPLOY}</Pre>
            <Pre>{DOCKER_SKETCH}</Pre>
          </Section>

          <Section id="tradeoffs" title="36. Architecture trade-offs" lead="Why / alternative / when you would flip.">
            <MiniTable
              headers={['Topic', 'Choose', 'Alternative', 'When alt']}
              rows={TRADEOFFS.map((t) => [t.topic, t.choose, t.alt, t.whenAlt])}
            />
          </Section>

          <Section id="mistakes" title="37. Production mistakes" lead="What Staff+ candidates call out before writing code.">
            <MiniTable
              headers={['Mistake', 'Why it hurts', 'Better']}
              rows={MISTAKES.map((m) => [m.bad, m.why, m.better])}
            />
          </Section>

          <Section id="adrs" title="38. ADRs" lead="Ten decisions you should be able to defend aloud.">
            <div className="space-y-3">
              {ADRS.map((a) => (
                <details key={a.id} className="rounded-2xl border border-slate-200 dark:border-slate-800">
                  <summary className="cursor-pointer px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {a.id}: {a.title}
                  </summary>
                  <div className="space-y-2 border-t border-slate-200 px-4 py-3 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                    <p>
                      <strong>Context:</strong> {a.context}
                    </p>
                    <p>
                      <strong>Decision:</strong> {a.decision}
                    </p>
                    <p>
                      <strong>Alternatives:</strong> {a.alternatives}
                    </p>
                    <p>
                      <strong>Consequences:</strong> {a.consequences}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section id="phases" title="39. Build phases" lead="Incremental delivery — do not dump the monorepo day one.">
            <MiniTable
              headers={['Phase', 'Outcome']}
              rows={PHASES.map((p) => [p.title, p.outcome])}
            />
          </Section>

          <Section id="interview-concepts" title="40. Concept interview packs" lead="30s / 2m / 10m / principal for core topics.">
            <ConceptPacks />
          </Section>

          <Section id="interview-100" title="41. 100+ advanced questions" lead="Filter by topic; expand for expert answers.">
            <Interview100Browser />
          </Section>

          <Section id="checklist" title="42. Production checklist">
            <ul className="space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {CHECKLIST.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700 dark:bg-slate-300" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="mock" title="43. Mock interview" lead="Principal interviewer ladder — self-score on threat model and failure modes.">
            <Pre>{MOCK_INTERVIEW}</Pre>
          </Section>
        </div>

        <StickyToc items={SPRING_AI_TOC} />
      </div>
    </div>
  );
}
