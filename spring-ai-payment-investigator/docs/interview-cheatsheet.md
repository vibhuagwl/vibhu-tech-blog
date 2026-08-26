# Interview Cheatsheet

## Stack
- Spring Boot 3.4.5 + Spring AI 1.1.8 + Java 21
- ChatClient + ToolCallAdvisor + scripted ChatModel (offline demo)
- SimpleVectorStore + hash embeddings (no API key)

## Key types
- `PaymentInvestigation` — structured output contract
- `InvestigationContext` — engineered context with budget
- `HarnessState` — pipeline state machine
- `ToolGateway` — single front door for all tools

## TXN-1001 scenario
- ₹250,000 NEFT to BANK-ABC
- BEN-001 / BENEFICIARY_INVALID
- 3 retries exhausted → investigation case

## Security talking points
1. AI cannot call `payment.execute`
2. Tool allowlist per role (SUPPORT = read-only writes blocked)
3. Prompt injection blocklist
4. PII redaction in context
5. HITL approval queue for execute/retry

## One-liner
> The model reasons and explains; Java authorizes, executes, and audits.
