package com.vibhu.payment.config;

import java.math.BigDecimal;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "payment")
public class PaymentProperties {
  /** in-memory | zeebe */
  private String orchestrationMode = "in-memory";

  private BigDecimal highValueThreshold = new BigDecimal("100000");
  private final Bank bank = new Bank();

  public String getOrchestrationMode() {
    return orchestrationMode;
  }

  public void setOrchestrationMode(String orchestrationMode) {
    this.orchestrationMode = orchestrationMode;
  }

  public BigDecimal getHighValueThreshold() {
    return highValueThreshold;
  }

  public void setHighValueThreshold(BigDecimal highValueThreshold) {
    this.highValueThreshold = highValueThreshold;
  }

  public Bank getBank() {
    return bank;
  }

  public static class Bank {
    private double failRate;
    private long timeoutMs = 200;

    public double getFailRate() {
      return failRate;
    }

    public void setFailRate(double failRate) {
      this.failRate = failRate;
    }

    public long getTimeoutMs() {
      return timeoutMs;
    }

    public void setTimeoutMs(long timeoutMs) {
      this.timeoutMs = timeoutMs;
    }
  }
}
