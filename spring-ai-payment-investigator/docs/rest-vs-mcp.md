# REST vs MCP

Both paths call the same `PaymentApplicationService` — no duplicate business logic.

## REST (ai-orchestrator :8090)

```bash
curl http://localhost:8090/api/payments/TXN-1001
```

- Synchronous HTTP
- Used by support dashboards and the AI chat harness (via `@Tool`)

## MCP (mcp-server :8091)

```bash
# MCP tool: getPayment(paymentId="TXN-1001")
```

- Discoverable tools for external AI clients (Claude Desktop, Cursor, etc.)
- Same JPA + seeder as orchestrator
- Thin wrapper — `@McpTool` delegates to domain service

## When to use which

| Use case | REST | MCP |
|----------|------|-----|
| In-app AI assistant | ✅ via @Tool | |
| External agent discovery | | ✅ |
| Human dashboard | ✅ | |
| Audit / gateway enforcement | ✅ (tool-gateway) | Direct read only |
