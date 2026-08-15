package com.example.designpatterns.creational.prototype;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;

class ReportConfigurationPrototypeDemoTest {
  @Test
  void shouldDeepCopyReportConfiguration() {
    var base =
        new ReportConfigurationPrototypeDemo.ReportConfiguration("daily", Map.of("country", "IN"));
    var copy = base.deepCopy();
    copy.putFilter("country", "US");
    assertThat(base.filter("country")).isEqualTo("IN");
  }
}
