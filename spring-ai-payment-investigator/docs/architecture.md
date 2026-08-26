# Architecture

```mermaid
flowchart TB
  subgraph Client
    REST[REST /api/ai/chat]
    MCP[MCP Server :8091]
  end

  subgraph ai-orchestrator
    HARNESS[AiExecutionHarness]
    CTX[ContextEngineeringService]
    SCRIPT[Scripted ChatModel]
    APPROVAL[ApprovalController]
  end

  subgraph tool-gateway
    GW[ToolGateway]
    AUTHZ[ToolAuthorizationService]
    TOOLS[InvestigationTools @Tool]
    AUDIT[ToolAuditService]
  end

  subgraph domain
    PAY[PaymentApplicationService]
    RAG[RagService]
    KAFKA[InMemoryKafkaEventStore]
    DB[(H2 / Postgres)]
  end

  REST --> HARNESS
  HARNESS --> CTX
  HARNESS --> SCRIPT
  SCRIPT --> TOOLS
  TOOLS --> GW
  GW --> AUTHZ
  GW --> AUDIT
  GW --> PAY
  GW --> RAG
  PAY --> DB
  PAY --> KAFKA
  MCP --> PAY
  APPROVAL --> PAY
```

## Principles

1. **AI never touches DB/Kafka directly** — only `@Tool` methods via `ToolGateway`
2. **AI never executes financial writes** — `payment.execute` blocked; HITL for retry/execute
3. **Context Engineering** builds prioritized, budgeted, PII-filtered prompt context
4. **Harness** enforces auth → validate → context → tools → structured output → audit → metrics

## Harness state machine

`RECEIVED → AUTHORIZED → CONTEXT_BUILT → RAG_RETRIEVED → MODEL_CALLED → TOOL_CALLING → TOOL_RESULTS_VALIDATED → OUTPUT_VALIDATED → COMPLETED | APPROVAL_REQUIRED | FAILED`
