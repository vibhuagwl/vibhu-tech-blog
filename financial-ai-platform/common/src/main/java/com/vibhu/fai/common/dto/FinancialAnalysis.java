package com.vibhu.fai.common.dto;

import java.math.BigDecimal;
import java.util.List;

public record FinancialAnalysis(
    String portfolioId,
    BigDecimal pnlAmount,
    String currency,
    String summary,
    List<String> topLossContributors,
    List<String> evidence,
    String riskLevel) {}
