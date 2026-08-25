package com.vibhu.ratelimit.api;

import java.util.Objects;

/**
 * Identity + routing attributes extracted from the inbound request (after auth). Rate-limit keys
 * must come from authenticated identity, not spoofable headers alone.
 */
public record RequestContext(
    String userId,
    String clientId,
    String tenantId,
    String ipAddress,
    String apiPath,
    String httpMethod,
    String serviceName,
    double cost) {

  public RequestContext {
    if (cost <= 0) {
      throw new IllegalArgumentException("cost must be > 0");
    }
  }

  public double effectiveCost() {
    return cost;
  }

  public static Builder builder() {
    return new Builder();
  }

  public static final class Builder {
    private String userId;
    private String clientId;
    private String tenantId;
    private String ipAddress;
    private String apiPath;
    private String httpMethod;
    private String serviceName;
    private double cost = 1.0;

    public Builder userId(String userId) {
      this.userId = userId;
      return this;
    }

    public Builder clientId(String clientId) {
      this.clientId = clientId;
      return this;
    }

    public Builder tenantId(String tenantId) {
      this.tenantId = tenantId;
      return this;
    }

    public Builder ipAddress(String ipAddress) {
      this.ipAddress = ipAddress;
      return this;
    }

    public Builder apiPath(String apiPath) {
      this.apiPath = apiPath;
      return this;
    }

    public Builder httpMethod(String httpMethod) {
      this.httpMethod = httpMethod;
      return this;
    }

    public Builder serviceName(String serviceName) {
      this.serviceName = serviceName;
      return this;
    }

    public Builder cost(double cost) {
      this.cost = cost;
      return this;
    }

    public RequestContext build() {
      return new RequestContext(
          blankToNull(userId),
          blankToNull(clientId),
          blankToNull(tenantId),
          blankToNull(ipAddress),
          blankToNull(apiPath),
          blankToNull(httpMethod),
          blankToNull(serviceName),
          cost);
    }

    private static String blankToNull(String value) {
      if (value == null) {
        return null;
      }
      String trimmed = value.trim();
      return trimmed.isEmpty() ? null : trimmed;
    }
  }

  public String require(String value, String field) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException(
          "RequestContext." + field + " is required for this policy");
    }
    return value;
  }

  public boolean hasClient() {
    return clientId != null;
  }

  public boolean hasTenant() {
    return tenantId != null;
  }

  public boolean hasUser() {
    return userId != null;
  }

  @Override
  public String toString() {
    return "RequestContext{tenant="
        + Objects.toString(tenantId, "-")
        + ", client="
        + Objects.toString(clientId, "-")
        + ", user="
        + Objects.toString(userId, "-")
        + ", api="
        + Objects.toString(apiPath, "-")
        + "}";
  }
}
