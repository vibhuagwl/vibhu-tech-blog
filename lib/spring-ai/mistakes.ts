/** Mistakes, checklist, testing, mock interview. */

export const MISTAKES: {bad: string; why: string; better: string}[] = [
  {bad: 'LLM calculates money', why: 'Non-deterministic, unauditable', better: 'Java calculators'},
  {bad: 'Unrestricted tools', why: 'Prompt injection → transfer', better: 'Allowlist + HITL writes'},
  {bad: 'Entire DB in prompt', why: 'Leakage, tokens, wrong context', better: 'Targeted tools + RAG'},
  {bad: 'Unlimited chat history', why: 'Cost, PII retention', better: 'TTL + summary + policy'},
  {bad: 'Trust model JSON', why: 'Schema drift', better: 'Validate + reconcile'},
  {bad: 'No timeout', why: 'Thread/pool exhaustion', better: 'Deadlines everywhere'},
  {bad: 'No cost controls', why: 'Tenant runaway spend', better: 'AI Gateway budgets'},
  {bad: 'No authz on tools', why: 'IDOR via model args', better: 'Authz in every tool'},
  {bad: 'No audit', why: 'Regulator failure', better: 'tool_audit + ai_request tables'},
  {bad: 'No injection defenses', why: 'Data exfil / jailbreak', better: 'Advisors + allowlists'},
  {bad: 'RAG for balances', why: 'Stale/wrong', better: 'Live services'},
  {bad: 'Agents for fixed KYC flow', why: 'Unstable path', better: 'Deterministic workflow'},
  {bad: 'Send PAN to LLM', why: 'PII/compliance', better: 'Redact / tokenize'},
  {bad: 'Every MS calls OpenAI', why: 'Keys sprawl, no control', better: 'AI Gateway'},
  {bad: 'No model fallback', why: 'Provider outage = total down', better: 'Multi-provider route'},
  {bad: 'No observability', why: 'Blind incidents', better: 'tokens/cost/tool metrics'},
];

export const CHECKLIST = [
  'AI never sole authority on money movement',
  'Deterministic P&L/risk calculators',
  'Tool allowlist + per-call authz + audit',
  'WRITE path requires human approval',
  'RAG only for documents; citations required',
  'Prompt injection tests in CI',
  'Timeouts/CB/bulkheads on LLM and MCP',
  'Token/cost budgets per tenant',
  'Conversation retention policy',
  'Embedding model version recorded',
  'Kafka consumers idempotent',
  'PII redaction before provider when feasible',
  'Canary for prompt/model changes',
  'Runbooks for LLM/vector/MCP outages',
  'Evaluation set for hallucination/tool choice',
];

export const TESTING = `Unit: tools authz, advisors, prompt templates, chunking, cosine search, MCP schema validation
Integration: Postgres, Kafka, Redis, vector, MCP, wiremocked LLM
AI eval: golden questions — hallucination, wrong tool, injection, bad RAG, malformed JSON
Prefer deterministic mock ChatModel in CI; shadow traffic eval in staging`;

export const PERF = `Benchmark p50/p95/p99 for: LLM, RAG, vector, tool, MCP, E2E chat
Concurrency: isolate pools (LLM client vs Tomcat vs tool CB)
Load test agent max-iteration storms; verify budgets trip`;

export const MOCK_INTERVIEW = `Interviewer opener:
  "Design a production-grade AI-powered financial intelligence platform using Spring AI."

Challenge ladder
  1) Why Spring AI vs raw SDK?
  2) MCP vs REST vs @Tool?
  3) How prevent hallucination on P&L?
  4) How stop unauthorized transfer via prompt injection?
  5) LLM down — degrade how?
  6) Vector down — what happens to compliance Q&A?
  7) Scale MCP; multi-tenant isolation
  8) Kafka replay during investigation
  9) Cost controls + model routing
  10) Evaluate RAG quality in production
  11) Zero-downtime prompt/model upgrade
  12) Where agents help vs hurt

Self-score like Staff+: clarity, threat model, failure modes, metrics, trade-offs.`;
