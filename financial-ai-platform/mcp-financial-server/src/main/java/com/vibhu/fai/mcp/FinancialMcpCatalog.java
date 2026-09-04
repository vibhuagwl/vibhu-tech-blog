package com.vibhu.fai.mcp;

import java.util.List;
import java.util.Map;

public final class FinancialMcpCatalog {

    private FinancialMcpCatalog() {
    }

    public static List<String> tools() {
        return List.of("getPayment", "getBankResponse", "searchCompliancePolicy");
    }

    public static List<String> resources() {
        return List.of("payment://{transactionId}", "policy://{policyId}");
    }

    public static Map<String, String> prompts() {
        return Map.of(
                "payment-investigation",
                "Investigate failed payment {transactionId} using tools and cite evidence.",
                "portfolio-risk-analysis",
                "Explain portfolio {portfolioId} P&L using Java calculatePnL only for numbers.");
    }
}
