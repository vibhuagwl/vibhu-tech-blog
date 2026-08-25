# AI Interview Cheat Sheet — FinTech Ops Assistant

## Stack anchors
- Java **21**, Spring Boot **3.4.5**, Spring AI **1.1.8**
- `@Tool` → `org.springframework.ai.tool.annotation.Tool`
- MCP → `org.springaicommunity.mcp.annotation.{McpTool,McpToolParam,McpResource,McpPrompt}`
- Advisors → `ToolCallAdvisor`, `MessageChatMemoryAdvisor`
- Scripted model → `@ConditionalOnProperty(app.ai.provider=scripted, matchIfMissing=true)`

## One-liners
| Topic | Answer |
|-------|--------|
| ChatModel vs ChatClient | Model = provider; Client = app API + advisors + tools |
| Tool loop | `ToolCallAdvisor` executes tools until final text/entity |
| PAY-123 | FAILED, BANK_TIMEOUT, HSBC, CUST-100, retryAllowed=true |
| SUPPORT role | READ tools only |
| WRITE tools | replayMessage, refundPayment → approval |
| RAG | `SimpleVectorStore` + `HashEmbeddingModel`, docs in `rag-service/.../docs/` |
| MCP auth | `X-MCP-API-KEY` — **not** provided by Spring AI starter |
| MCP ports | payment 8091, customer 8092, kafka 8093, reporting 8094 |
| Assistant port | 8080, headers `X-User-Id`, `X-User-Role` |
| No OpenAI key | `OpsScriptedChatModel` + exclude OpenAiAutoConfiguration |

## Harness order
1. InputGuardrail → 2. IntentRouter → 3. ContextBuilder (memory+RAG) → 4. ToolPolicy → 5. PreparedAiCall → 6. ChatClient → 7. OutputGuardrail → 8. Observability/Eval

## HTTP examples
```bash
# Investigate
curl -X POST localhost:8080/api/ai/chat -H 'Content-Type: application/json' \
  -H 'X-User-Role: OPS' -d '{"conversationId":"c1","message":"Why did PAY-123 fail?"}'

# Approve replay
curl -X POST localhost:8080/api/approvals/APR-XXXXXXXX/approve -H 'X-User-Role: ADMIN'
```

## Mermaid mental model
`Client → AiController → AiHarness.prepare → ChatClient(+ToolCallAdvisor) → @Tool → DomainService`

## Red flags in interviews
- Letting LLM hit DB directly
- WRITE without approval
- No evidence in failure analysis
- MCP exposed without API key in prod
- Trusting "ignore previous instructions"

## Test names to mention
`shouldInvestigatePay123`, `shouldRejectUnauthorizedTool`, `shouldRequireApprovalForReplay`, `shouldRejectPromptInjection`, `shouldBuildRelevantContext`

## Build
```bash
mvn -q -DskipTests package && mvn -pl ai-assistant -am test
```
