package com.vibhu.multitenant.tenant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenant_configuration")
public class TenantConfigurationEntity {

  @Id
  @Column(name = "tenant_id")
  private UUID tenantId;

  @Column(nullable = false, length = 3)
  private String currency = "USD";

  @Column(nullable = false, length = 64)
  private String timezone = "UTC";

  @Column(nullable = false, length = 16)
  private String locale = "en-US";

  @Column(name = "feature_flags", nullable = false, length = 2000)
  private String featureFlags = "{}";

  @Column(name = "payment_provider", nullable = false, length = 64)
  private String paymentProvider = "stripe-lab";

  @Column(name = "max_users", nullable = false)
  private int maxUsers = 100;

  @Column(name = "rate_limit_per_minute", nullable = false)
  private int rateLimitPerMinute = 1000;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  public UUID getTenantId() {
    return tenantId;
  }

  public void setTenantId(UUID tenantId) {
    this.tenantId = tenantId;
  }

  public String getCurrency() {
    return currency;
  }

  public void setCurrency(String currency) {
    this.currency = currency;
  }

  public String getTimezone() {
    return timezone;
  }

  public void setTimezone(String timezone) {
    this.timezone = timezone;
  }

  public String getLocale() {
    return locale;
  }

  public void setLocale(String locale) {
    this.locale = locale;
  }

  public String getFeatureFlags() {
    return featureFlags;
  }

  public void setFeatureFlags(String featureFlags) {
    this.featureFlags = featureFlags;
  }

  public String getPaymentProvider() {
    return paymentProvider;
  }

  public void setPaymentProvider(String paymentProvider) {
    this.paymentProvider = paymentProvider;
  }

  public int getMaxUsers() {
    return maxUsers;
  }

  public void setMaxUsers(int maxUsers) {
    this.maxUsers = maxUsers;
  }

  public int getRateLimitPerMinute() {
    return rateLimitPerMinute;
  }

  public void setRateLimitPerMinute(int rateLimitPerMinute) {
    this.rateLimitPerMinute = rateLimitPerMinute;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
