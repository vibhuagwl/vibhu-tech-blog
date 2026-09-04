# Financial Intelligence & Payment Investigation Platform

Production-shaped Spring AI FinTech system: ChatClient + advisors, in-process `@Tool`s, **MCP client/server**,
ingest→chunk→embed→retrieve **RAG**, human approval for writes, and **Prometheus metrics**.

Architecture reference: https://vibhuagwl.github.io/vibhu-tech-blog/spring-ai/

## Layout

```text
HTTP / Kafka          MCP (SSE :8091)           Java + DB
─────────────         ────────────────          ─────────
ai-orchestrator  ←→  mcp-financial-server  →  PaymentService
 ChatClient              @Tool / @McpResource    PnLCalculator
 RAG pipeline            RAG retrieve            ApprovalService
 Micrometer              Prometheus
```

| Module                 | Role                                                                                   |
|------------------------|----------------------------------------------------------------------------------------|
| `common`               | DTOs, money calculators, RAG pipeline (chunk / embed / vector store / markdown ingest) |
| `ai-orchestrator`      | Human HTTP API, ChatClient, in-process tools, RAG advisor, metrics (`:8080`)           |
| `mcp-financial-server` | Discoverable MCP tools/resources/prompts for AI clients (`:8091`)                      |

**AI** reasons, picks tools, explains. **Java** calculates, authorizes, executes, audits. **DB** is source of truth.

## Run (single process, scripted model, no API key)

```bash
cd financial-ai-platform
mvn test
mvn -pl ai-orchestrator -am spring-boot:run
```

```bash
curl -s localhost:8080/api/ai/chat -H 'Content-Type: application/json' \
  -d '{"conversationId":"C100","question":"Why did payment TXN-1001 fail?"}'

curl -s localhost:8080/api/ops/ai
curl -s localhost:8080/actuator/prometheus | grep fai_
```

Also: `"Why did my portfolio PORT-100 PnL decrease today?"` and `"Can I reverse payment TXN-1001?"` then
`POST /api/approvals/{id}/approve`.

## Run MCP server (second process)

```bash
mvn -pl mcp-financial-server -am spring-boot:run
curl -s localhost:8091/api/mcp/manifest
curl -s localhost:8091/actuator/prometheus | grep fai_mcp
```

Point the orchestrator at it (after both are up):

```bash
mvn -pl ai-orchestrator -am spring-boot:run -Dspring-boot.run.arguments=--spring.ai.mcp.client.enabled=true
```

MCP tools call a **stub ledger** by default (`app.payments.source=stub`). For live payments set
`app.payments.source=rest` so the MCP server reads `http://localhost:8080/api/payments/{id}`.

## RAG pipeline

Classpath markdown under `common/src/main/resources/policies/` → metadata parse → `TextChunker` → `HashEmbeddingModel` →
`InMemoryVectorStore` → retrieve with **tenant + jurisdiction** filters → citations (`policyId`). Same corpus is
ingested by orchestrator and MCP server.

Offline hash embeddings so tests run without OpenAI. Swap `HashEmbeddingModel` for a Spring AI `EmbeddingModel` in
production.

## Production metrics

| Meter                                                 | Meaning                     |
|-------------------------------------------------------|-----------------------------|
| `fai.chat.duration{intent}`                           | Chat orchestration latency  |
| `fai.tool.calls{tool,outcome}`                        | In-process tool invocations |
| `fai.rag.retrieve.duration` / `fai.rag.retrieve.hits` | Retrieval                   |
| `fai.rag.ingest.chunks`                               | Ingest volume               |
| `fai.approval.decisions{status}`                      | Propose vs execute          |
| `fai.model.call.duration`                             | Advisor-timed model call    |
| `fai.mcp.tool.duration` / `fai.mcp.tool.calls`        | MCP server tools            |

## Tests & coverage

```bash
mvn test
# JaCoCo: common/target/site/jacoco/index.html
#         ai-orchestrator/target/site/jacoco/index.html
```

See `CODE-INTERVIEW-NOTES.md`.
