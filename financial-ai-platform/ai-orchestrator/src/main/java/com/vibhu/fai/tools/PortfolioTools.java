package com.vibhu.fai.tools;

import com.vibhu.fai.audit.ToolAuditService;
import com.vibhu.fai.common.dto.PositionView;
import com.vibhu.fai.common.security.AuthContext;
import com.vibhu.fai.portfolio.PortfolioService;
import com.vibhu.fai.web.RequestAuthHolder;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class PortfolioTools {

  private final PortfolioService portfolios;
  private final ToolAuditService audit;

  public PortfolioTools(PortfolioService portfolios, ToolAuditService audit) {
    this.portfolios = portfolios;
    this.audit = audit;
  }

  @Tool(description = "Get portfolio positions with live prices and unrealized P&L. Read-only.")
  public List<PositionView> getPositions(String portfolioId) {
    AuthContext auth = RequestAuthHolder.get();
    List<PositionView> views = portfolios.getPositions(portfolioId, auth);
    audit.record("getPositions", Map.of("portfolioId", portfolioId), true);
    return views;
  }

  @Tool(description = "Calculate deterministic portfolio unrealized P&L in Java. Do not estimate.")
  public BigDecimal calculatePnL(String portfolioId) {
    AuthContext auth = RequestAuthHolder.get();
    BigDecimal pnl = portfolios.calculatePnL(portfolioId, auth);
    audit.record("calculatePnL", Map.of("portfolioId", portfolioId), true);
    return pnl;
  }

  @Tool(description = "Calculate concentration risk level (LOW/MEDIUM/HIGH) in Java.")
  public String calculateRisk(String portfolioId) {
    AuthContext auth = RequestAuthHolder.get();
    String risk = portfolios.calculateRisk(portfolioId, auth);
    audit.record("calculateRisk", Map.of("portfolioId", portfolioId), true);
    return risk;
  }
}
