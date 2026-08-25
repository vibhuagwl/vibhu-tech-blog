# INTERVIEW.md — FinTech AI Ops Assistant

40 key questions with strong answers. Each includes **30s**, **1m**, **3m**, and **10m** response depths.

---

## 1. Why separate ChatModel from ChatClient?

**30s:** ChatModel talks to the LLM provider; ChatClient is the app fluent API with advisors, tools, and memory.

**1m:** `ChatModel` is the transport abstraction (OpenAI, Ollama, or our `OpsScriptedChatModel`). `ChatClient` composes system prompts, registers tools, chains advisors like `ToolCallAdvisor` and `MessageChatMemoryAdvisor`, and maps structured output. Controllers should depend on harness + ChatClient, not raw HTTP to OpenAI.

**3m:** Separation enables swapping providers without rewriting orchestration. Advisors implement cross-cutting concerns (security, PII, audit, tool loop) with explicit ordering. Tests use scripted ChatModel to exercise the full tool loop deterministically.

**10m:** In production you'd add resilience (timeouts, circuit breakers), cost controls, and tenant-scoped memory keys. The harness prepares `PreparedAiCall` so policy/context is provider-agnostic; ChatClient execution stays a single integration point. This mirrors hexagonal architecture: domain + harness = core, ChatModel = outbound port.

---

## 2. What does ToolCallAdvisor do?

**30s:** It runs the model↔tools loop until the model returns a final answer.

**1m:** When the model emits tool calls, the advisor invokes matching `@Tool` methods, appends `ToolResponseMessage`, and re-prompts the model. This is how PAY-123 investigation calls `getPayment` then `getPaymentFailureReason` before structured JSON.

**3m:** Ordering matters: memory advisor persists turns; tool advisor handles recursion with limits. Write tools still hit `ToolAuthorizationService` inside the tool bean — the advisor does not bypass RBAC.

**10m:** Combine with observability spans per tool, idempotency keys for writes, and human approval gates that throw `ApprovalRequiredException` before side effects. MCP tools follow the same domain services but cross process boundaries with API key auth.

---

## 3. @Tool vs MCP — when to use which?

**30s:** `@Tool` = in-process; MCP = cross-service discovery via protocol.

**1m:** Payment ops in `ai-assistant` use `@Tool` for low latency and shared `UserContext`. MCP servers expose the same domain to other agents or IDEs with `@McpTool`, resources, and prompts.

**3m:** MCP adds operational concerns: auth (`X-MCP-API-KEY`), versioning, independent deploy, streamable HTTP. In-process tools inherit Spring Security headers and approval flow directly.

**10m:** Hybrid architecture: core assistant uses in-process tools; edge integrations (vendor agents, desktop clients) use MCP. Keep domain logic in `domain-services` so both paths stay consistent. Document that Spring AI MCP starter does **not** ship auth — you must enforce it (as in our `SecurityConfig`).

---

## 4. How does PAY-123 investigation work end-to-end?

**30s:** Route intent → RAG context → scripted model requests payment tools → returns `PaymentInvestigation` with BANK_TIMEOUT evidence.

**1m:** User asks "Why did PAY-123 fail?"; `IntentRouter` → `PAYMENT_FAILURE_ANALYSIS`; RAG retrieves retry/runbook docs; `OpsScriptedChatModel` issues tool calls; domain returns FAILED/HSBC/BANK_TIMEOUT; output guardrail requires evidence.

**3m:** `ToolPolicy` limits tools by role. SUPPORT can read; replay/refund need OPS + approval. Conversation memory keys by `conversationId`.

**10m:** Walk through sequence: HTTP headers → harness prepare → ChatClient → ToolCallAdvisor iterations → `PaymentInvestigation` enrichment from RAG doc IDs → eval scores for tool selection quality. Mention idempotent retries and HSBC runbook citation.

---

## 5. How do you block prompt injection?

**30s:** `InputGuardrail` deny-lists patterns like "ignore previous instructions".

**1m:** Checked before any model call. Refund-all style injections throw `PromptInjectionException`. Complement with output guardrails requiring tool evidence for factual claims.

**3m:** Layer defenses: input patterns, tool allow-lists per intent, RBAC on writes, no direct SQL from LLM, audit logs. Never trust model prose for financial state.

**10m:** Production adds ML classifiers, canary prompts, rate limits per user, and separation of system vs user content channels. FinOps assistants should default deny on bulk refund/replay language without ticket IDs.

---

## 6. Explain ToolRisk READ vs WRITE.

**30s:** READ tools query state; WRITE tools change state and need elevated roles plus approval.

**1m:** `ToolAuthorizationService` maps each tool. SUPPORT only gets READ. OPS/ADMIN can invoke write tools but `HumanApprovalGate` proposes first.

**3m:** `replayMessage` returns `REPLAY_PROPOSED` until `/api/approvals/{id}/approve`. Same for `refundPayment`.

**10m:** Align with SOX-style controls: dual control, immutable audit trail, break-glass ADMIN with extra logging. Tool metadata should expose `readOnlyHint` in MCP annotations for client UX.

---

## 7. Why Scripted ChatModel for demos?

**30s:** Runs without API keys while exercising real Spring AI tool loop.

**1m:** `OpsScriptedChatModel` pattern-matches user text, emits `AssistantMessage.ToolCall`, then final JSON matching `PaymentInvestigation`.

**3m:** Enables CI tests (`shouldInvestigatePay123`) and interview walkthroughs without cloud spend. Toggle `app.ai.provider=openai` in real deployments.

**10m:** Script covers failure analysis, retry advice, status, kafka replay, and reporting paths. Keep scripted responses aligned with domain seed data to avoid teaching bad habits.

---

## 8. How does RAG work here?

**30s:** Hash embeddings + `SimpleVectorStore` over classpath markdown policies.

**1m:** `DocumentSeeder` loads docs at startup; `RagService.retrieve` does cosine similarity with optional metadata filters.

**3m:** No external embedding API — `HashEmbeddingModel` gives deterministic local vectors. Context builder attaches `retrievedDocIds` to `AiContext` for citations (e.g. `payment-retry-policy` for BANK_TIMEOUT).

**10m:** Production would use managed embeddings, chunking, hybrid search, freshness TTL, and access-controlled document stores. Keep FinOps runbooks versioned and tie doc IDs to change tickets.

---

## 9. What is PreparedAiCall?

**30s:** Harness output: system prompt, allowed tools, and enriched context before LLM invocation.

**1m:** Decouples policy from provider. `executeWith(ChatClient, tools...)` runs the call and applies output guardrails + eval.

**3m:** Enables testing `prepare()` without network. Intent-specific tool subsets reduce attack surface.

**10m:** Pattern extends to multi-agent routing: different prepared calls per specialist model while sharing domain services.

---

## 10. How is conversation memory scoped?

**30s:** `MessageChatMemoryAdvisor` + `conversationId` param; harness also keeps a lightweight summary map.

**1m:** Windowed in-memory chat memory (24 messages). Production: `tenant:user:conversation` composite key.

**3m:** Memory is not authorization — always re-check role on each tool invocation via `UserContextHolder`.

**10m:** Redis-backed `ChatMemory` for HA; encrypt at rest; TTL per regulatory retention policy.

---

## 11–40 (concise strong answers)

| # | Question | Strong answer (1m) |
|---|----------|------------------|
| 11 | Failure code BANK_TIMEOUT? | HSBC gateway SLA breach; retry allowed per policy doc; not fraud by default. |
| 12 | Why HSBC in seed data? | Demonstrates bank-specific runbook RAG + domain fields on `PaymentRecord`. |
| 13 | Kafka replay safety? | Propose first; OPS approves; message moves FAILED → REPLAY_PROPOSED → REPLAYED. |
| 14 | MCP STREAMABLE protocol? | HTTP streaming MCP session; endpoint `/mcp`; replaces legacy SSE for servers. |
| 15 | MCP resources vs tools? | Resources expose readable artifacts (policies); tools perform actions/queries. |
| 16 | MCP prompts? | Reusable prompt templates (`investigate-payment`) for clients. |
| 17 | Why domain-services module? | Single source of truth for assistant `@Tool` and MCP servers. |
| 18 | AccessDenied vs UnauthorizedTool? | Custom `UnauthorizedToolException` keeps domain free of Spring Security dependency. |
| 19 | ApprovalService flow? | `propose` stores PENDING; `approve` executes domain side effect idempotently. |
| 20 | Default user role? | SUPPORT via `X-User-Role` default — least privilege. |
| 21 | OpenAI on classpath but disabled? | Starter present for real deployments; autoconfig excluded in `application.yml` for tests. |
| 22 | Observability? | `AiObservability` records span timings per harness phase. |
| 23 | Eval scores? | `AiEvaluationService` scores relevance, tool selection, safety. |
| 24 | Entity mapping? | `PaymentInvestigation` record parsed from model JSON via `ChatClient.entity()`. |
| 25 | Output guardrail? | Requires evidence + root cause — prevents hallucinated failure reasons. |
| 26 | IntentRouter extensibility? | Add intents + `ToolPolicy` mapping without changing controllers. |
| 27 | docker-compose purpose? | Optional Postgres/Redis/Kafka for future persistence — not required for demo. |
| 28 | Payment ID format? | PAY-* not TXN-* — aligns with ops vocabulary in requirements. |
| 29 | Customer CUST-100? | Links payment history and risk tier for contextual answers. |
| 30 | Reporting tools? | `getDailyFailureSummary` aggregates FAILED payments for standups. |
| 31 | Resilience4j on classpath? | Ready for rate limits/circuit breakers on external bank calls. |
| 32 | Actuator? | Health/prometheus on assistant and MCP servers. |
| 33 | MCP client profile? | `application-mcp.yml` documents remote tool discovery — off by default. |
| 34 | Multi-module Maven benefits? | Clear boundaries: model, domain, RAG, harness, deployables. |
| 35 | Testing strategy? | Integration tests on assistant with scripted model + real Spring context. |
| 36 | CSRF disabled? | Stateless API; use gateway auth in production. |
| 37 | API key rotation? | Configure `app.mcp.api-key` via secrets manager; enable security in prod. |
| 38 | Hash embedding limitations? | Lexical only — fine for interview/demo; replace in production. |
| 39 | Tool loop max iterations? | Spring AI defaults — tune for runaway protection. |
| 40 | Staff-level summary? | Java owns truth + auth; AI orchestrates with guardrails; MCP for ecosystem; approvals for writes. |

---

*Use with `AI_INTERVIEW_CHEAT_SHEET.md` and `docs/INTERVIEW-100.md` for rapid revision.*
