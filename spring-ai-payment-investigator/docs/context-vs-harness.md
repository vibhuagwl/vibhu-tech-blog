# Context Engineering vs Execution Harness

## Context Engineering (`ContextEngineeringService`)

**What:** Builds the *input* the model sees — ranked, deduplicated, budget-truncated, PII-filtered.

**Priority order:**
1. Security (role, tenant)
2. Payment facts (extracted TXN id)
3. Tool results (from prior turns)
4. Policy (RAG retrieval)
5. Memory
6. Conversation

**Budget:** Default 8000 chars — lower-priority items truncated first.

## Execution Harness (`AiExecutionHarness`)

**What:** Runs the *pipeline* with guardrails and observability.

**Steps:**
1. Auth (user context from headers)
2. Input validation (prompt injection blocklist)
3. PII filter (in context builder)
4. Context build + tool allowlist
5. ChatClient + ToolCallAdvisor loop
6. Structured output validation (`PaymentInvestigation`)
7. Audit + Micrometer counters

**Limits:** max 10 tool calls, 5 model iterations, 30s wall clock (configurable in `application.yml`).

## Interview soundbite

> Context Engineering = *what the model knows*. Harness = *how the call is safely executed*.
