/** Advisors, memory, agents, guardrails. */

export const ADVISORS = `Advisor chain (Spring AI 1.0+ CallAdvisor / StreamAdvisor):

User Request
 ↓
SecurityAdvisor          // authz context, deny jailbreaks early
 ↓
PIIRedactionAdvisor      // mask before model when possible
 ↓
MessageChatMemoryAdvisor // requires ChatMemory.CONVERSATION_ID param
 ↓
QuestionAnswerAdvisor    // RAG context
 ↓
AuditAdvisor             // record prompt hash / tool intents
 ↓
CostControlAdvisor       // budget check
 ↓
ChatModel

Why advisors: cross-cutting without sprawling orchestration code;
ordering matters; keep side effects explicit and testable.

MessageChatMemoryAdvisor.builder(chatMemory).build()
QuestionAnswerAdvisor.builder(vectorStore).build()
Pass conversation id per call:
  .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))`;

export const MEMORY = `User → Conversation → Memory → Prompt context → LLM

Types
  short-term / session message window
  summary memory (compress old turns)
  long-term user prefs (careful with PII)
  VectorStoreChatMemoryAdvisor for semantic recall (escape content; injection risk)

Token limits → memory explosion → summarize or truncate
Persist in Redis/DB with TTL + tenant key
When NOT to store: highly sensitive investigations without retention policy;
  always honor delete/right-to-erasure`;

export const AGENT = `Portfolio Analysis Agent (controlled)

Observes question → selects allowlisted tools → stops when enough evidence
  or maxIterations / timeout / budget exceeded.

Expose execution traces (not hidden chain-of-thought):
  Tool selected: getPortfolio
  Tool selected: getPositions
  Tool selected: getMarketPrices
  Tool selected: calculatePnL
  Tool selected: calculateRisk
  RAG: policy chunks POL-RISK-02
  Final structured FinancialAnalysis

Production agents need: state store, termination conditions, tool failure policy,
idempotent tool calls, and human escalation hooks.`;

export const GUARDRAILS = `max tool calls / max iterations
wall-clock timeout + token budget
allowlist tools (read) vs deny/propose-only (write)
confidence / retrieval threshold → refuse
deterministic validation of structured output
circuit breaker on LLM/MCP
fallback: "I cannot verify; open case for human analyst"

READ → auto
WRITE financial ops → approval required`;
