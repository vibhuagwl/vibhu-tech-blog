/** End-to-end use cases. */

export const USECASE_PNL = `User: "Why is my portfolio down 3% today and which positions contributed most?"

Flow
User → API GW (OAuth2) → AI Gateway → Orchestrator ChatClient/Agent
  → getPortfolio(id) [authz]
  → getPositions(id)
  → getMarketPrices(symbols) [Redis/Kafka projection]
  → calculatePnL(id, today) [Java]
  → calculateExposure(id)
  → optional Risk tool
  → RAG market/risk policy snippets
  → entity(FinancialAnalysis)
  → validate vs calculator
  → response + evidence + audit + metrics + trace

Expect logs: tool spans, sql by portfolio_id, vector topK, token usage, cost`;

export const USECASE_PAYMENT = `User: "Why did payment TXN123 fail?"

AI → getTransaction / getPaymentStatus → Payment Service
  → Kafka history / payment logs (via service)
  → RAG payment/compliance policy
  → Structured root cause + recommended action
  → Case note

Root causes might be: insufficient funds, KYC hold, bank reject code, timeout —
sourced from systems, explained by LLM, not invented.`;

export const USECASE_REVERSAL = `User: "Can we reverse this ₹20 lakh transaction?"

AI → read transaction → risk + compliance tools → authorization
  → create Approval (propose only)
  → human approves
  → execution service runs reversal
  → audit

Why safer than LLM execute: separation of proposal vs authority,
maker-checker, immutable audit, policy gates independent of model.`;

export const RESPONSE_EXAMPLE = `{
  "summary": "Portfolio down 3.1% today; 82% of loss from INFY and TCS longs.",
  "pnl": {"amount": -310000.00, "currency": "INR", "asOf": "2026-08-25"},
  "contributors": [
    {"symbol": "INFY", "contributionPct": 0.51},
    {"symbol": "TCS", "contributionPct": 0.31}
  ],
  "evidence": ["tool:calculatePnL", "tool:getMarketPrices", "doc:POL-RISK-02"],
  "executionId": "exec_01H..."
}`;
