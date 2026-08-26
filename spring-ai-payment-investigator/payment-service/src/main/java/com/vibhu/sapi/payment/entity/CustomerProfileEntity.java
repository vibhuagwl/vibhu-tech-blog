package com.vibhu.sapi.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "customer_profiles")
public class CustomerProfileEntity {

  @Id
  @Column(length = 32)
  private String customerId;

  @Column(nullable = false, length = 128)
  private String name;

  @Column(nullable = false, length = 32)
  private String segment;

  @Column(nullable = false, length = 16)
  private String riskTier;

  private int failedPaymentsLast30Days;

  private int totalPaymentsLast30Days;

  public String getCustomerId() {
    return customerId;
  }

  public void setCustomerId(String customerId) {
    this.customerId = customerId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getSegment() {
    return segment;
  }

  public void setSegment(String segment) {
    this.segment = segment;
  }

  public String getRiskTier() {
    return riskTier;
  }

  public void setRiskTier(String riskTier) {
    this.riskTier = riskTier;
  }

  public int getFailedPaymentsLast30Days() {
    return failedPaymentsLast30Days;
  }

  public void setFailedPaymentsLast30Days(int failedPaymentsLast30Days) {
    this.failedPaymentsLast30Days = failedPaymentsLast30Days;
  }

  public int getTotalPaymentsLast30Days() {
    return totalPaymentsLast30Days;
  }

  public void setTotalPaymentsLast30Days(int totalPaymentsLast30Days) {
    this.totalPaymentsLast30Days = totalPaymentsLast30Days;
  }
}
