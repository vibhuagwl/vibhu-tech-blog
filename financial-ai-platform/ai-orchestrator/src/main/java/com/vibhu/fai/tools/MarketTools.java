package com.vibhu.fai.tools;

import com.vibhu.fai.audit.ToolAuditService;
import com.vibhu.fai.market.MarketService;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class MarketTools {
  private final MarketService market;
  private final ToolAuditService audit;

  public MarketTools(MarketService market, ToolAuditService audit) {
    this.market = market;
    this.audit = audit;
  }

  @Tool(description = "Get latest market price for a symbol from market service/cache. Read-only.")
  public BigDecimal getMarketPrice(String symbol) {
    BigDecimal px = market.getPrice(symbol);
    audit.record("getMarketPrice", Map.of("symbol", symbol), true);
    return px;
  }
}
