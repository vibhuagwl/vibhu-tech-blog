package com.vibhu.msp.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import com.vibhu.msp.common.MspHeaders;
import org.junit.jupiter.api.Test;

class MspHeadersTest {

  @Test
  void correlationHeaderConstant() {
    assertThat(MspHeaders.CORRELATION_ID).isEqualTo("X-Correlation-Id");
  }
}
