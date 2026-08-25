package com.vibhu.fai.common.calc;

import com.vibhu.fai.common.dto.PositionView;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

/**
 * ============================================================
 * INTERVIEW NOTES
 * ============================================================
 * AI = reason / orchestrate / explain
 * Java = calculate money (deterministic, auditable)
 * NEVER let the LLM invent P&L numbers.
 * Memory: LLM explains; Java calculates.
 * ============================================================
 */
public final class PnLCalculator {

  private PnLCalculator() {}

  public static BigDecimal totalUnrealized(List<PositionView> positions) {
    return positions.stream()
        .map(PositionView::unrealizedPnl)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  public static List<PositionView> topLosses(List<PositionView> positions, int n) {
    return positions.stream()
        .sorted(Comparator.comparing(PositionView::unrealizedPnl))
        .limit(n)
        .toList();
  }
}
