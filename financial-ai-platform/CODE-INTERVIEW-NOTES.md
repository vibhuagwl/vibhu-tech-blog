# Code Interview Notes (concise)

Question: What is ChatClient?
Answer: Application-facing Spring AI fluent API over ChatModel (prompt, advisors, tools, entity).
Memory: ChatClient = front door to Spring AI.

Question: ChatModel vs ChatClient?
Answer: ChatModel = provider call. ChatClient = app API + advisors/tools.
Memory: Model speaks provider; Client speaks application.

Question: What is an Advisor?
Answer: Cross-cutting interceptor around ChatClient calls (memory, security, RAG, audit).
Memory: Advisors ≈ filters; order matters.

Question: What is @Tool?
Answer: In-process Java method exposed to the model with schema/description.
Memory: Model calls tools; tools call services; services own authz.

Question: MCP vs @Tool vs REST?
Answer: @Tool=in-process; MCP=discoverable cross-process AI capabilities; REST=human/service APIs.
Memory: MCP is capability discovery, not a ledger.

Question: What is RAG?
Answer: Retrieve policy/doc chunks via embeddings, then generate with citations.
Memory: RAG for knowledge — never live balances/prices/P&L.

Question: Embeddings / VectorStore?
Answer: Text→vector; cosine NN search; filter by tenant metadata.
Memory: Similar meaning ⇒ nearby vectors.

Question: Conversation memory?
Answer: MessageWindowChatMemory + MessageChatMemoryAdvisor; pass ChatMemory.CONVERSATION_ID every call.
Memory: Key = tenant:user:conversation.

Question: Structured output?
Answer: `.entity(Record.class)` then Java validate business fields.
Memory: Valid JSON ≠ valid finance.

Question: Human approval?
Answer: LLM proposes (ApprovalRequest); human approves; service executes + audit.
Memory: READ auto; WRITE approve.

Question: Kafka / Outbox / Idempotency?
Answer: At-least-once ⇒ idempotent consumers; outbox decouples payment commit from notification.
Memory: Side effects are not the payment transaction.

Question: Redis vs Caffeine?
Answer: Caffeine=L1 local; Redis=L2 shared; DB=truth.
Memory: Cache optimizes; DB decides.

Question: Circuit breaker / retry?
Answer: Retry only idempotent reads; never blind-retry money writes.
Memory: Safe to retry getPayment; dangerous to retry executePayment.
