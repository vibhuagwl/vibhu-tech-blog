# 100 Interview Questions — FinTech AI Ops Platform

Grouped for revision. **Top 40** have fuller answers in `INTERVIEW.md`.

---

## A. Spring AI fundamentals (1–15)

1. What is Spring AI? — Abstraction over LLMs, tools, RAG, memory in Spring Boot.
2. ChatModel interface? — `call(Prompt)` → `ChatResponse`.
3. ChatClient builder pattern? — Fluent prompts, advisors, tools, `entity()`.
4. ToolCallAdvisor purpose? — Automates tool execution loop.
5. MessageChatMemoryAdvisor? — Persists conversation by `CONVERSATION_ID`.
6. `@Tool` annotation package? — `org.springframework.ai.tool.annotation.Tool`.
7. How are tools discovered? — Spring scans `@Component` beans, registers methods.
8. Structured output? — `call().entity(PaymentInvestigation.class)`.
9. AssistantMessage.ToolCall fields? — id, type, name, arguments (JSON).
10. ToolResponseMessage role? — Feeds tool results back to model.
11. Difference from LangChain? — Spring-native DI, Boot autoconfig, same concepts.
12. Spring AI BOM version used? — 1.1.8.
13. OpenAI starter without key? — Exclude autoconfig; use scripted ChatModel.
14. Advisor ordering? — `@Order` / `advisorOrder` on ToolCallAdvisor.
15. Memory window size here? — 24 messages (`MessageWindowChatMemory`).

## B. MCP (16–30)

16. What is MCP? — Model Context Protocol for tools/resources/prompts across processes.
17. MCP server starter? — `spring-ai-starter-mcp-server-webmvc`.
18. Protocol property? — `spring.ai.mcp.server.protocol=STREAMABLE`.
19. Endpoint? — `streamable-http.mcp-endpoint=/mcp`.
20. `@McpTool` package? — `org.springaicommunity.mcp.annotation`.
21. `@McpToolParam`? — Describes JSON schema parameters.
22. `@McpResource`? — Exposes URI-addressable content (policies).
23. `@McpPrompt`? — Template prompts for clients.
24. MCP vs REST? — MCP = LLM-oriented discovery + schema; REST = general APIs.
25. Who provides MCP server auth? — **You do** (API key filter in this repo).
26. Local MCP security flag? — `app.mcp.security.enabled=false`.
27. Production MCP key header? — `X-MCP-API-KEY`.
28. MCP client profile? — `application-mcp.yml`, disabled by default.
29. Sync vs async MCP server? — `spring.ai.mcp.server.type=SYNC`.
30. Tool list changed notifications? — MCP annotations support list-changed providers.

## C. Domain & seed data (31–45)

31. Payment PAY-123 status? — FAILED.
32. Failure code? — BANK_TIMEOUT.
33. Bank? — HSBC.
34. Customer? — CUST-100.
35. retryAllowed? — true.
36. Kafka message for PAY-123? — MSG-501 on `payments.outbound`.
37. PaymentService methods? — get, search, status, failure reason, refund.
38. CustomerService methods? — get, transactions, risk.
39. KafkaOpsService replay without approval? — Returns REPLAY_PROPOSED.
40. ReportingService? — payment report + daily failure summary.
41. Why in-memory maps? — Runnable demo without docker.
42. DomainDataSeeder? — `@PostConstruct` seeds ConcurrentHashMaps.
43. Refund after approval? — Status becomes REFUNDED.
44. Transaction IDs? — TXN-9001 linked to PAY-123.
45. Illegal payment lookup? — `IllegalArgumentException`.

## D. Security & governance (46–60)

46. Roles? — SUPPORT, OPS, ADMIN (`Role` enum).
47. SUPPORT tool access? — READ only.
48. UnauthorizedToolException? — Custom exception in common-model.
49. Write tools? — replayMessage, refundPayment.
50. ApprovalRequest statuses? — PENDING, EXECUTED.
51. HumanApprovalGate? — Proposes and throws `ApprovalRequiredException`.
52. Approval REST? — `POST /api/approvals/{id}/approve`.
53. User headers? — X-User-Id, X-User-Role (default SUPPORT).
54. UserContextHolder? — ThreadLocal for tool authorization.
55. Prompt injection example blocked? — "ignore previous instructions".
56. Output guardrail rule? — Evidence required for investigations.
57. ToolPolicy purpose? — Intent-scoped allow-list ∩ role allow-list.
58. Why not AccessDeniedException in domain? — Avoid spring-security dependency in domain-services.
59. MCP production MUST? — Enable API key auth.
60. Least privilege default? — SUPPORT role when header missing.

## E. RAG (61–72)

61. Vector store class? — `SimpleVectorStore` (Spring AI).
62. Embedding implementation? — `HashEmbeddingModel` (local hash/bag-of-words).
63. Similarity metric? — Cosine (SimpleVectorStore default).
64. Seeded documents? — 6 markdown files under `rag-service/.../docs/`.
65. BANK_TIMEOUT doc? — payment-error-codes.md, payment-retry-policy.md.
66. RagService.retrieve filters? — Optional metadata filter expression.
67. ContextBuilder RAG usage? — Populates `retrievedDocIds` in `AiContext`.
68. Why not OpenAI embeddings? — No API key required for demo/CI.
69. Document metadata? — docId, source, category.
70. HSBC runbook doc? — hsbc-payment-runbook.md.
71. RAG without vector DB? — In-memory store sufficient for interview scope.
72. Production RAG upgrade? — Managed embeddings + pgvector/OpenSearch.

## F. Harness & orchestration (73–85)

73. AiHarness.prepare output? — `PreparedAiCall`.
74. IntentRouter intents? — PAYMENT_FAILURE_ANALYSIS, STATUS, RETRY, KAFKA_REPLAY, REPORT, GENERAL.
75. InputGuardrail? — Blocks injection phrases.
76. OutputGuardrail? — Validates investigation completeness.
77. ConversationMemory? — ConcurrentHashMap summaries.
78. AiObservability? — Span timing list + logs.
79. AiEvaluationService metrics? — relevance, toolSelection, safety, overall.
80. executeWith signature? — Accepts ChatClient + tools + response mapper.
81. Why separate prepare/execute? — Test policy without LLM; swap providers.
82. System prompt contents? — Intent, docs, entities, allowed tools.
83. enrichInvestigation? — Fills missing fields from context/seed.
84. Intent for "replay kafka"? — KAFKA_REPLAY.
85. Intent for "daily summary"? — REPORT.

## G. Testing & operations (86–100)

86. Integration test class? — `AiAssistantIntegrationTest`.
87. shouldInvestigatePay123 asserts? — Intent + BANK_TIMEOUT + PAY-123 in answer.
88. shouldRejectUnauthorizedTool? — SUPPORT cannot authorize replayMessage.
89. shouldRequireApprovalForReplay? — Status REPLAY_PROPOSED.
90. shouldRejectPromptInjection? — PromptInjectionException on prepare.
91. shouldBuildRelevantContext? — paymentId entity + non-empty RAG docs.
92. Maven package command? — `mvn -q -DskipTests package`.
93. Test command? — `mvn -pl ai-assistant -am test`.
94. docker-compose services? — postgres, redis, redpanda (optional).
95. Default data store? — In-memory (no compose required).
96. Assistant actuator? — health, info, prometheus.
97. MCP server ports? — 8091–8094.
98. Scripted provider property? — `app.ai.provider=scripted`.
99. Module dependency direction? — assistant → harness → domain/rag → common-model.
100. Staff elevator pitch? — Java domain truth + Spring AI orchestration + MCP ecosystem + RBAC/approval guardrails; PAY-123 BANK_TIMEOUT walkthrough proves the pattern.

---

**Deep dives:** see `INTERVIEW.md` questions 1–10 for 30s/1m/3m/10m formats.
