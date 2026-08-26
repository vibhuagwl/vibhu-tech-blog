# Spring AI Payment Investigator

**Standalone multi-module Java / Maven / Spring Boot project** (Java 21).

Multi-module Maven lab for **Context Engineering + AI Execution Harness + Tool Gateway** payment failure investigation.

- Spring Boot **3.4.5**, Spring AI **1.1.8**, Java **21**
- Default profile: **H2 in-memory**, scripted `ChatModel` (no OpenAI key)
- Seed scenario: **TXN-1001** / **BEN-001** / 3 retries
- Includes **Maven Wrapper** (`./mvnw`) — no global Maven required

## Open as a Java project (IDE)

This folder is a complete Maven root (`pom.xml` + modules). Open **this directory**, not only the monorepo parent, so the IDE indexes Java sources.

### IntelliJ IDEA
1. **File → Open…** → select `spring-ai-payment-investigator/pom.xml` (or the folder)
2. Choose **Open as Project** / import as **Maven**
3. Wait for indexing; modules (`common`, `payment-service`, `ai-orchestrator`, …) appear in the Project tool window
4. Run `PaymentInvestigatorApplication` in module `ai-orchestrator`

### Cursor / VS Code
1. **File → Open Folder…** → `spring-ai-payment-investigator`
   - or open `spring-ai-payment-investigator.code-workspace`
2. Install recommended extensions (Java Pack + Spring Boot + Maven) when prompted
3. Command Palette → **Java: Import Java projects in workspace**
4. Run/Debug → **PaymentInvestigatorApplication**

### CLI
```bash
cd spring-ai-payment-investigator
./mvnw test
./mvnw -pl ai-orchestrator spring-boot:run
```

## Modules

| Module | Purpose |
|--------|---------|
| `common` | DTOs, enums, security context |
| `payment-service` | JPA domain, Kafka event store, TXN-1001 seeder |
| `rag-service` | Policy docs + hash-embedding vector store |
| `tool-gateway` | ToolGateway, authz, audit, `@Tool` facades |
| `ai-orchestrator` | Main app — harness, context, REST, HITL |
| `mcp-server` | Optional MCP server (same domain service) |

## Quick start

```bash
cd spring-ai-payment-investigator
./mvnw test                              # H2 + scripted model, no Docker
./mvnw -pl ai-orchestrator spring-boot:run
```

App: http://localhost:8090

## Investigate TXN-1001

```bash
curl -s -X POST http://localhost:8090/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo" \
  -d '{"conversationId":"demo-1","message":"Why did payment TXN-1001 fail?"}' | jq
```

## REST payment (same service as MCP)

```bash
curl -s http://localhost:8090/api/payments/TXN-1001 | jq
```

## MCP server (optional)

```bash
./mvnw -pl mcp-server spring-boot:run   # port 8091
```

## Docker infra (optional)

```bash
docker compose up -d   # postgres, redis, kafka — for prod-like profile
cp .env.example .env
```

## Docs

- [architecture.md](docs/architecture.md)
- [context-vs-harness.md](docs/context-vs-harness.md)
- [tool-catalog.md](docs/tool-catalog.md)
- [rest-vs-mcp.md](docs/rest-vs-mcp.md)
- [demo.md](docs/demo.md)
- [interview-cheatsheet.md](docs/interview-cheatsheet.md)
