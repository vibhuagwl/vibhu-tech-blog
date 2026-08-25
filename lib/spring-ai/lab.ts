/** Runnable lab callout for the Spring AI hub page. */

export const LAB_GITHUB =
  'https://github.com/vibhuagwl/vibhu-tech-blog/tree/main/financial-ai-platform';

export const LAB_RUN = `cd financial-ai-platform
mvn clean test
mvn -pl ai-orchestrator -am package -DskipTests
java -jar ai-orchestrator/target/ai-orchestrator-1.0.0-SNAPSHOT.jar`;

export const LAB_CURL = `curl -s localhost:8080/api/ai/chat -H 'Content-Type: application/json' \\
  -d '{"conversationId":"C100","question":"Why did payment TXN-1001 fail?"}'`;

export const LAB_RESPONSE = `{
  "transactionId": "TXN-1001",
  "status": "FAILED",
  "rootCause": "Payment rejected by bank: account closed (AC04)",
  "evidence": ["PAYMENT-TXN-1001", "POL-PAYMENT-004"],
  "recommendedAction": "Ask customer to update beneficiary account; do not retry same account",
  "approvalRequired": false
}`;

export const LAB_LAYOUT = `financial-ai-platform/
├── ai-orchestrator/     # Spring Boot app (ChatClient, tools, RAG, approvals)
├── common/              # DTOs + PnL/Risk calculators (Java = money)
├── mcp-financial-server/# MCP capability catalog
├── docker-compose.yml   # optional Postgres/Redis/Kafka
└── CODE-INTERVIEW-NOTES.md

Default profile: H2 + Caffeine + scripted ChatModel (no OpenAI key).
Open key classes:
  tools/PaymentTools.java
  model/FintechScriptedChatModel.java
  orchestrator/FinancialAiOrchestrator.java
  rag/InMemoryFinancialVectorStore.java
  approval/ApprovalService.java`;
