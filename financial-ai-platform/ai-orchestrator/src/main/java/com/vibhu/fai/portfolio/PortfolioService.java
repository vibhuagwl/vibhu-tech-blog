package com.vibhu.fai.portfolio;

import com.vibhu.fai.common.calc.PnLCalculator;
import com.vibhu.fai.common.calc.RiskCalculator;
import com.vibhu.fai.common.dto.PositionView;
import com.vibhu.fai.common.security.AuthContext;
import com.vibhu.fai.market.MarketService;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PortfolioService {

  private final PositionRepository positions;
  private final MarketService market;

  public PortfolioService(PositionRepository positions, MarketService market) {
    this.positions = positions;
    this.market = market;
  }

  public List<PositionView> getPositions(String portfolioId, AuthContext auth) {
    return positions.findByPortfolioId(portfolioId).stream()
        .filter(p -> auth.tenantId().equals(p.getTenantId()))
        .map(
            p -> {
              BigDecimal last = market.getPrice(p.getSymbol());
              BigDecimal mv = last.multiply(p.getQuantity());
              BigDecimal cost = p.getAvgCost().multiply(p.getQuantity());
              return new PositionView(
                  p.getSymbol(), p.getQuantity(), p.getAvgCost(), last, mv, mv.subtract(cost));
            })
        .toList();
  }

  public BigDecimal calculatePnL(String portfolioId, AuthContext auth) {
    return PnLCalculator.totalUnrealized(getPositions(portfolioId, auth));
  }

  public String calculateRisk(String portfolioId, AuthContext auth) {
    return RiskCalculator.concentrationRisk(getPositions(portfolioId, auth));
  }
}
