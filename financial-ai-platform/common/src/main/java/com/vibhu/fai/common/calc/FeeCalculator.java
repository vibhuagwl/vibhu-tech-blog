package com.vibhu.fai.common.calc;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class FeeCalculator {
  private FeeCalculator() {}

  public static BigDecimal paymentFee(BigDecimal amount) {
    return amount.multiply(new BigDecimal("0.001")).setScale(2, RoundingMode.HALF_UP);
  }
}
