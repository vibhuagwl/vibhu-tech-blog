package com.vibhu.fai.common.calc;

import com.vibhu.fai.common.dto.PositionView;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public final class RiskCalculator {

  private RiskCalculator() {}

  public static String concentrationRisk(List<PositionView> positions) {
    BigDecimal total = positions.stream()
        .map(p -> p.marketValue().abs())
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    if (total.signum() == 0) {
      return "LOW";
    }
    BigDecimal maxShare =
        positions.stream()
            .map(p -> p.marketValue().abs().divide(total, 4, RoundingMode.HALF_UP))
            .max(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);
    if (maxShare.compareTo(new BigDecimal("0.40")) >= 0) {
      return "HIGH";
    }
    if (maxShare.compareTo(new BigDecimal("0.25")) >= 0) {
      return "MEDIUM";
    }
    return "LOW";
  }
}
