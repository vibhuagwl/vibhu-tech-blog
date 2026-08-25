package com.vibhu.fai.common.calc;

import static org.assertj.core.api.Assertions.assertThat;

import com.vibhu.fai.common.dto.PositionView;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class PnLCalculatorTest {

  @Test
  void sumsUnrealized() {
    List<PositionView> positions =
        List.of(
            new PositionView("A", BigDecimal.ONE, BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, new BigDecimal("-5")),
            new PositionView("B", BigDecimal.ONE, BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, new BigDecimal("-2")));
    assertThat(PnLCalculator.totalUnrealized(positions)).isEqualByComparingTo("-7");
  }
}
