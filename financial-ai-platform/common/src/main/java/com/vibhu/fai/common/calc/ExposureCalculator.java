package com.vibhu.fai.common.calc;

import com.vibhu.fai.common.dto.PositionView;
import java.math.BigDecimal;
import java.util.List;

public final class ExposureCalculator {
  private ExposureCalculator() {}

  public static BigDecimal grossExposure(List<PositionView> positions) {
    return positions.stream()
        .map(p -> p.marketValue().abs())
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }
}
