# Spring AI Payment Investigator

Multi-module Maven lab for **Context Engineering + AI Execution Harness + Tool Gateway** payment failure investigation.

- Spring Boot **3.4.5**, Spring AI **1.1.8**, Java **21**
- Default profile: **H2 in-memory**, scripted `ChatModel` (no OpenAI key)
- Seed scenario: **TXN-1001** / **BEN-001** / 3 retries

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
mvn test                    # H2 + scripted model, no Docker
mvn -pl ai-orchestrator spring-boot:run
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
mvn -pl mcp-server spring-boot:run   # port 8091
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
