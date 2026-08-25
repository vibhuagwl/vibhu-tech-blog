# Financial Intelligence & Payment Investigation Platform

Runnable Spring AI FinTech app (modular monolith). Architecture reference:
https://vibhuagwl.github.io/vibhu-tech-blog/spring-ai/

## What it does
- Payment investigation via ChatClient + `@Tool`s
- Portfolio P&L via **Java calculators** (LLM explains only)
- Reversal **proposal** + human approval (LLM never executes money movement)
- In-memory RAG over policies with tenant filters
- Scripted ChatModel so it runs **without an OpenAI key**

## Run
```bash
cd financial-ai-platform
mvn clean test
mvn -pl ai-orchestrator -am package -DskipTests
java -jar ai-orchestrator/target/ai-orchestrator-1.0.0-SNAPSHOT.jar
```

Or: `mvn -pl ai-orchestrator -am spring-boot:run` (run from `ai-orchestrator` module context).

```bash
curl -s localhost:8080/api/ai/chat -H 'Content-Type: application/json' \
  -d '{"conversationId":"C100","question":"Why did payment TXN-1001 fail?"}'
```

Also try:
- `"Why did my portfolio PORT-100 PnL decrease today?"`
- `"Can I reverse payment TXN-1001?"` then `POST /api/approvals/{id}/approve`

## Memory model
```text
SPRING AI = C T R M A S
AI = reason/orchestrate/explain
JAVA = calculate/authorize/execute/audit
DB = source of truth
```

See `CODE-INTERVIEW-NOTES.md`.
