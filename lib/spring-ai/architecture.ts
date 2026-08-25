/** Architecture, modules, product, ADRs, phases. */

export const MISSION = `Real-Time Financial Intelligence & Trading Assistant

Not a toy chatbot. A production-shaped platform where Spring AI orchestrates:
  tools / MCP · RAG · structured output · memory · agents · approvals
while Java services own money, risk, authz, and audit.

Interview goal: explain WHY each piece exists, failure modes, and what AI must never own.`;

export const PRODUCT_CAPS = `Customer / trader asks natural language. Examples:
  • Why did portfolio P&L decrease today?
  • Why did payment TXN123 fail?
  • Can we reverse this ₹20 lakh transaction?
  • Summarize market move for INFY; compare securities
  • Search compliance policy for large cash transfers
  • Explain risk alert RSK-991

For every question the orchestrator decides:
  1) required facts  2) tools vs RAG  3) deterministic calc
  4) authz  5) human approval?  6) evidence/citations  7) structured result`;

export const ARCH_DIAGRAM = `Client (Web / Mobile / Ops Console)
        │
   API Gateway (OAuth2/JWT, rate limit)
        │
   AI Gateway (routing, budgets, safety)
        │
   Financial AI Orchestrator (Spring AI)
   ┌────────────────────────────────────┐
   │ ChatClient · Advisors · Memory     │
   │ Tools · Structured Output · RAG    │
   │ Embeddings · VectorStore · MCP     │
   └────────────────────────────────────┘
        │                    │
   MCP Financial Server   Internal services
        │                 Portfolio · Market · Payment
        │                 Risk · Compliance · Audit
        │
   Kafka · Redis · PostgreSQL · Vector DB · LLM Provider`;

export const COMPONENT_ROLES: [string, string][] = [
  ['API Gateway', 'Authn edge, TLS, WAF, rate limits, route to AI/APIs'],
  ['AI Gateway', 'Model routing, token budgets, provider failover, prompt templates'],
  ['AI Orchestrator', 'ChatClient pipelines, tool/MCP calls, RAG, agents, HITL'],
  ['MCP Server', 'Discoverable financial tools/resources/prompts with schemas + authz'],
  ['Portfolio/Market/…', 'Deterministic domain services — source of truth'],
  ['RAG / Vector', 'Policies & docs retrieval — not balances/prices'],
  ['Kafka', 'Real-time events; AI reads via services/caches, not raw bus in prompts'],
  ['Redis', 'Session/memory/cache with TTLs; never sole ledger'],
  ['PostgreSQL', 'Transactional truth + audit + approvals'],
  ['Observability', 'Traces, token/cost metrics, tool latency, RAG quality'],
];

export const MODULES = `financial-ai-platform/
├── ai-gateway/              # routing, budgets, provider abstraction
├── ai-orchestrator/         # Spring AI ChatClient, advisors, agents
├── mcp-financial-server/    # MCP tools/resources/prompts
├── rag-service/             # ingest, chunk, embed, search
├── portfolio-service/
├── transaction-service/
├── market-data-service/
├── risk-service/
├── compliance-service/
├── notification-service/
├── audit-service/
├── approval-service/        # human-in-the-loop
└── common/                  # DTOs, security, observability

Java 21 · Spring Boot 3.x · Spring AI 1.0+ · Maven multi-module`;

export const ADRS: {id: string; title: string; context: string; decision: string; alternatives: string; consequences: string}[] = [
  {
    id: 'ADR-001',
    title: 'Why Spring AI?',
    context: 'Need portable LLM/tools/RAG across providers with Spring idioms.',
    decision: 'Spring AI ChatClient + abstractions for model, tools, vector, MCP.',
    alternatives: 'Direct OpenAI SDK; LangChain4j alone; custom HTTP wrappers.',
    consequences: 'Faster composition; must track Spring AI version upgrades.',
  },
  {
    id: 'ADR-002',
    title: 'Why MCP?',
    context: 'Many clients need the same financial tools with discovery & schemas.',
    decision: 'Expose domain capabilities via MCP server; orchestrator is MCP client.',
    alternatives: 'Only @Tool in-process; only REST OpenAPI for LLM.',
    consequences: 'Reusable tools across agents/IDEs; extra security surface.',
  },
  {
    id: 'ADR-003',
    title: 'Why RAG?',
    context: 'Policies/runbooks change; cannot fine-tune for every doc update.',
    decision: 'RAG over compliance/ops docs with citations; filter by metadata.',
    alternatives: 'Fine-tuning; stuffing all docs in prompt; pure keyword search.',
    consequences: 'Fresher answers; retrieval quality becomes a product risk.',
  },
  {
    id: 'ADR-004',
    title: 'Why Vector Store?',
    context: 'Semantic similarity needed for policy wording variance.',
    decision: 'Start in-memory for labs; production pgvector or dedicated VS.',
    alternatives: 'Only Elasticsearch BM25; only SQL LIKE.',
    consequences: 'Hybrid search often best; embedding version must be managed.',
  },
  {
    id: 'ADR-005',
    title: 'Why Kafka?',
    context: 'Market/payment/risk events are streams needing replay & fan-out.',
    decision: 'Kafka as event backbone; AI consumes via services/caches.',
    alternatives: 'RabbitMQ; polling DB; webhook-only.',
    consequences: 'Ordering per key; at-least-once + idempotency required.',
  },
  {
    id: 'ADR-006',
    title: 'Why Redis?',
    context: 'Hot prices, conversation memory, rate limits, caches.',
    decision: 'Redis with explicit TTLs; never authoritative for money.',
    alternatives: 'Local Caffeine only; Postgres for everything.',
    consequences: 'Stale price risk if TTL wrong; need invalidation on events.',
  },
  {
    id: 'ADR-007',
    title: 'Why PostgreSQL?',
    context: 'Transactional portfolios, approvals, audit, durable state.',
    decision: 'Postgres as SoT; optional pgvector for vectors.',
    alternatives: 'NoSQL ledger; multiple DBs without clear SoT.',
    consequences: 'Strong consistency for money paths; scale reads carefully.',
  },
  {
    id: 'ADR-008',
    title: 'Why a controlled agent?',
    context: 'Multi-step portfolio investigation needs tool planning.',
    decision: 'Bounded agent with max iterations, allowlist tools, execution traces.',
    alternatives: 'Single-shot ChatClient; pure BPMN without LLM.',
    consequences: 'Powerful but must guard cost/loops/unauthorized tools.',
  },
  {
    id: 'ADR-009',
    title: 'Deterministic financial calculations',
    context: 'P&L/risk must be auditable and exact.',
    decision: 'Java calculators only; LLM explains calculator output.',
    alternatives: 'Ask LLM to compute; spreadsheet in prompt.',
    consequences: 'Non-negotiable in regulated finance.',
  },
  {
    id: 'ADR-010',
    title: 'Human approval for write operations',
    context: 'Transfers/reversals can move real money.',
    decision: 'WRITE tools require risk+compliance+HITL; AI proposes only.',
    alternatives: 'Fully autonomous agent with limits; maker-checker only.',
    consequences: 'Safer; higher latency for writes; audit trail mandatory.',
  },
];

export const PHASES = [
  {id: 'p1', title: 'Phase 1–3: Basics · ChatClient · Structured output', outcome: 'Safe chat + typed RiskAnalysis'},
  {id: 'p2', title: 'Phase 4–5: Tools · MCP', outcome: 'Discoverable financial tools'},
  {id: 'p3', title: 'Phase 6–9: RAG · embeddings · vector stores', outcome: 'Cited policy answers'},
  {id: 'p4', title: 'Phase 10–12: Memory · Advisors · Agent', outcome: 'Bounded multi-step analysis'},
  {id: 'p5', title: 'Phase 13–15: Kafka · Security · HITL', outcome: 'Real-time + approvals'},
  {id: 'p6', title: 'Phase 16–20: Obs · Resilience · Perf · K8s', outcome: 'Production checklist green'},
];

export const TRADEOFFS: {topic: string; choose: string; alt: string; whenAlt: string}[] = [
  {topic: 'REST vs MCP', choose: 'MCP for discoverable agent tools', alt: 'REST/OpenAPI', whenAlt: 'Human APIs / non-agent clients'},
  {topic: 'Kafka vs Rabbit', choose: 'Kafka for replayable market/payment streams', alt: 'Rabbit', whenAlt: 'Simple task queues'},
  {topic: 'Redis vs Postgres', choose: 'Redis hot cache/memory', alt: 'Postgres', whenAlt: 'Authoritative durable state'},
  {topic: 'pgvector vs dedicated VS', choose: 'pgvector early/medium', alt: 'Dedicated vector DB', whenAlt: 'Huge corpus + specialized ANN'},
  {topic: 'Sync vs async AI', choose: 'Sync for chat UX', alt: 'Async Kafka investigation', whenAlt: 'Long multi-tool cases'},
  {topic: 'Agent vs workflow', choose: 'Agent for exploratory Q&A', alt: 'BPMN/Camunda', whenAlt: 'Fixed regulated steps'},
  {topic: 'LLM vs service', choose: 'LLM for NL + planning', alt: 'Classic service', whenAlt: 'Deterministic rules/math'},
  {topic: 'RAG vs fine-tune', choose: 'RAG for changing policies', alt: 'Fine-tune', whenAlt: 'Stable style/domain tone'},
  {topic: 'Local vs hosted embed', choose: 'Hosted for quality/ops', alt: 'Local', whenAlt: 'Air-gapped / cost control'},
  {topic: 'Small vs large model', choose: 'Route by complexity', alt: 'Always large', whenAlt: 'Rarely justified by cost'},
];
