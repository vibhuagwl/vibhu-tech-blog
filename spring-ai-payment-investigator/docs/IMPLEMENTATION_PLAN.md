# Implementation Plan — Spring AI Payment Investigator

## Existing architecture (do not overwrite)

| Project | Role | Versions |
|---------|------|----------|
| `financial-ai-platform/` | TXN-* monolith, ChatClient advisors, JPA, optional Kafka listener, MCP **catalog only** | Boot 3.4.5, Spring AI 1.1.8 |
| `ai-fintech-platform/` | PAY-* multi-module, `AiHarness`, runnable MCP servers, RAG, HITL | Boot 3.4.5, Spring AI 1.1.8 |
| Blog `/spring-ai/` | Conceptual playbook + explorers | Next.js static |

**Decision:** Create sibling `spring-ai-payment-investigator/` — cherry-pick patterns, do **not** modify the two labs except optional blog links.

## Existing reusable components (patterns only)

- ChatClient + `ToolCallAdvisor` + `MessageChatMemoryAdvisor` (Spring AI 1.1.x)
- `@Tool` beans calling domain services (never DB from model)
- Scripted `ChatModel` for offline/demo without API keys
- RAG with `SimpleVectorStore` / hash embeddings
- `@McpTool` WebMVC servers
- Guardrails / approval / tool policy ideas from `ai-harness`

## Missing components (this project fills)

| Gap | New type |
|-----|----------|
| Explicit Context Engineering pipeline | `ContextEngineeringService`, budget, provenance |
| Named execution harness + state machine | `AiExecutionHarness`, `HarnessState` |
| Central tool gateway | `ToolGateway` (AuthZ + allowlist + audit + timeout) |
| Scenario TXN-1001 / BEN-001 / 3 retries | Seed + E2E as specified |
| Context-vs-harness / tool catalog / skill docs | `docs/`, `skills/` |
| Docker-backed optional infra | `docker-compose.yml` (Postgres, Redis, Kafka) |

## Files to create

Entire tree under `spring-ai-payment-investigator/` (see README). Blog: `/spring-ai-investigator` hub + source explorer.

## Files to modify (blog only)

- `lib/site-nav.ts`, `app/sitemap.ts`, new `app/spring-ai-investigator*/`, `lib/spring-ai-investigator-source.ts`
- Optional short link from `components/spring-ai/spring-ai-hub.tsx`

## Dependency changes

Parent BOM: Spring Boot 3.4.5, Spring AI 1.1.8, Resilience4j 2.2.0, Java 21. No secrets in repo.

## Execution order

1. Docs (this plan, architecture, context-vs-harness)
2. `common` DTOs / security / enums
3. `payment-service` domain + seed TXN-1001
4. `rag-service` policies BEN-001
5. `tool-gateway` + `@Tool` facades
6. `ai-orchestrator` context + harness + REST + scripted model + HITL + Kafka consumer
7. `mcp-server` (same domain via gateway)
8. Tests + docker-compose + demo + skills
9. Blog wiring

## Test strategy

- Unit: context budget, tool authz, output validation, injection
- Integration: MockMvc chat E2E with scripted model
- Failure cases: unauthorized execute, RAG down, payment down, malformed JSON, injection
- Default profile: H2 + in-memory Redis/Kafka stubs so `mvn test` needs no Docker

## Spring AI API note

Use Spring AI **1.1.8** APIs already proven in-repo (`ChatClient.builder`, `@Tool`, `ToolCallAdvisor`, `MessageWindowChatMemory`, `@McpTool`). Do not invent deprecated APIs.
