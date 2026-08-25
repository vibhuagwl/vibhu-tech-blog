package com.vibhu.fai.mcp;

import java.util.List;
import java.util.Map;

/**
 * ============================================================
 * INTERVIEW NOTES — MCP
 * ============================================================
 * @Tool = in-process. MCP = discoverable tools/resources/prompts
 * across a process boundary for AI clients/agents.
 * REST remains for human/service APIs.
 * Wire spring-ai-starter-mcp-server when deploying a standalone MCP process.
 * ============================================================
 */
public final class FinancialMcpCatalog {

  private FinancialMcpCatalog() {}

  public static List<String> tools() {
    return List.of(
        "get_payment",
        "get_payment_history",
        "get_portfolio",
        "get_positions",
        "get_market_price",
        "calculate_pnl",
        "calculate_risk",
        "search_compliance_policy");
  }

  public static List<String> resources() {
    return List.of("payment://{transactionId}", "portfolio://{portfolioId}", "policy://{policyId}");
  }

  public static Map<String, String> prompts() {
    return Map.of(
        "payment-investigation",
        "Investigate failed payment {transactionId} using tools and cite evidence.",
        "portfolio-risk-analysis",
        "Explain portfolio {portfolioId} P&L using calculatePnL tool only for numbers.");
  }
}
