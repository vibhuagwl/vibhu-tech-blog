/** Spring AI fundamentals, ChatClient, prompts, structured output. */

export const FUNDAMENTALS_FLOW = `Application
   ↓
ChatClient  (fluent API, advisors, tools)
   ↓
Prompt (SystemMessage + UserMessage + history/context)
   ↓
ChatModel  (provider abstraction)
   ↓
LLM Provider (OpenAI-compatible / others)
   ↓
ChatResponse / Generation
   ↓
.content() | .entity(T) | stream tokens

Business logic for money/authz lives in Java services & tools —
NOT inside the model prompt as the source of truth.

Spring AI version: 1.0+ GA APIs referenced below.
If your BOM differs, check upgrade notes for advisor/MCP renames.`;

export const MODEL_OPTIONS = `Configure via application.yaml / ModelOptions:
  temperature — lower for finance (less creative)
  max tokens — bound cost/latency
  top-p — nucleus sampling
  timeout — hard deadline
  retry / fallback — Resilience4j around ChatModel calls
  model selection — route cheap vs strong

Interview line: temperature is a product risk control in FinTech, not a toy knob.`;

export const CHATCLIENT_CODE = `// Spring AI 1.0+ style
@Bean
ChatClient financialChatClient(ChatModel chatModel, ChatMemory chatMemory, VectorStore vectorStore) {
  return ChatClient.builder(chatModel)
      .defaultSystem("""
          You are a financial assistant for authenticated users.
          Use tools for facts. Never invent balances, prices, or P&L.
          Cite document ids for policy answers. Refuse unauthorized actions.
          """)
      .defaultAdvisors(
          MessageChatMemoryAdvisor.builder(chatMemory).build(),
          QuestionAnswerAdvisor.builder(vectorStore).build()
      )
      .build();
}

// Sync
String answer = chatClient.prompt()
    .user("Explain why payment transaction TXN123 failed.")
    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
    .call()
    .content();

// Streaming — better UX for long research summaries
Flux<String> tokens = chatClient.prompt()
    .user("Summarize today's market movement for my watchlist.")
    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
    .stream()
    .content();

// When to stream: long narrative UX. When not: structured JSON for APIs.`;

export const PROMPTS = `BAD
  "Tell me everything about the portfolio and fix any issues."
  → unbounded scope, implies write power, invites hallucination

GOOD system
  Role: read-only analyst unless tool is approval-gated.
  Rules: tools for facts; Java calculators for money; cite docs; refuse transfers.

GOOD user template
  Analyze portfolio {portfolioId} for session user {userId}.
  Question: {question}
  Constraints: no writes; show tool evidence; return RiskAnalysis JSON schema.

Prompt architecture
  • versioned templates in repo (prompt-v3-portfolio.yaml)
  • few-shot only for format, not for inventing numbers
  • context-window budget: memory summary + top-k chunks + tool results
  • evaluate prompts with golden cases (injection, missing tool, bad RAG)
  • guardrails: deny lists, PII redaction advisor before model`;

export const STRUCTURED_CODE = `public record RiskAnalysis(
    String instrument,
    BigDecimal exposure,
    String riskLevel,          // validate enum after parse
    List<String> reasons,
    List<String> recommendations,
    List<String> evidenceIds
) {}

RiskAnalysis analysis = chatClient.prompt()
    .user(userQuestion)
    .tools(portfolioTools, riskTools)
    .call()
    .entity(RiskAnalysis.class);

// NEVER trust blindly
validate(analysis);                 // schema + bean validation
riskEngine.assertConsistent(analysis, calculatorSnapshot);
auditService.record(analysis);

Flow:
LLM → Structured Output → Java Validation → Business Rules → Approved Result`;

export const STRUCTURED_NOTES = `Malformed JSON → retry with stricter schema instruction / converter
Enum drift → map + reject unknown
Missing evidenceIds for RAG claims → fail closed in compliance mode
BeanOutputConverter / entity mapping — prefer typed records over free text APIs`;
