package com.vibhu.ratelimit.api;

import java.time.Duration;
import java.util.Objects;

/**
 * Token-bucket policy: {@code capacity} is the burst ceiling; {@code refillRate}
 * tokens are added every {@code refillPeriod} (the sustained window).
 *
 * <p>Example: 100 req/min with burst 20 → capacity=120, refillRate=100, refillPeriod=MINUTE.
 */
public record RateLimitPolicy(
    String id,
    RateLimitScope scope,
    RateLimitAlgorithm algorithm,
    long capacity,
    long refillRate,
    RefillPeriod refillPeriod,
    Duration timeWindow,
    FailPolicy failPolicy,
    String clientId,
    String tenantId,
    String apiPath,
    String serviceName,
    boolean blocked
) {

  public RateLimitPolicy {
    Objects.requireNonNull(id, "id");
    Objects.requireNonNull(scope, "scope");
    algorithm = algorithm == null ? RateLimitAlgorithm.TOKEN_BUCKET : algorithm;
    if (capacity <= 0) {
      throw new IllegalArgumentException("capacity must be > 0");
    }
    if (refillRate <= 0) {
      throw new IllegalArgumentException("refillRate must be > 0");
    }
    refillPeriod = refillPeriod == null ? RefillPeriod.MINUTE : refillPeriod;
    timeWindow = timeWindow == null ? refillPeriod.duration() : timeWindow;
    failPolicy = failPolicy == null ? FailPolicy.FAIL_OPEN : failPolicy;
  }

  public static Builder builder() {
    return new Builder();
  }

  public long ttlMillis() {
    // Keep idle buckets at least 2 windows so a slow client does not lose leftover tokens instantly.
    return Math.max(timeWindow.toMillis() * 2, refillPeriod.toMillis() * 2);
  }

  public boolean matches(RequestContext ctx) {
    if (blocked && matchesIdentity(ctx)) {
      return true;
    }
    return matchesIdentity(ctx);
  }

  private boolean matchesIdentity(RequestContext ctx) {
    if (tenantId != null && !tenantId.equals(ctx.tenantId())) {
      return false;
    }
    if (clientId != null && !clientId.equals(ctx.clientId())) {
      return false;
    }
    if (apiPath != null && !apiPath.equals(ctx.apiPath())) {
      return false;
    }
    if (serviceName != null && !serviceName.equals(ctx.serviceName())) {
      return false;
    }
    return switch (scope) {
      case GLOBAL -> true;
      case TENANT, TENANT_API -> ctx.hasTenant();
      case CLIENT, CLIENT_API -> ctx.hasClient();
      case USER -> ctx.hasUser();
      case API -> ctx.apiPath() != null;
      case IP -> ctx.ipAddress() != null;
      case SERVICE -> ctx.serviceName() != null;
    };
  }

  public static final class Builder {
    private String id;
    private RateLimitScope scope = RateLimitScope.CLIENT_API;
    private RateLimitAlgorithm algorithm = RateLimitAlgorithm.TOKEN_BUCKET;
    private long capacity = 100;
    private long refillRate = 100;
    private RefillPeriod refillPeriod = RefillPeriod.MINUTE;
    private Duration timeWindow;
    private FailPolicy failPolicy = FailPolicy.FAIL_OPEN;
    private String clientId;
    private String tenantId;
    private String apiPath;
    private String serviceName;
    private boolean blocked;

    public Builder id(String id) {
      this.id = id;
      return this;
    }

    public Builder scope(RateLimitScope scope) {
      this.scope = scope;
      return this;
    }

    public Builder algorithm(RateLimitAlgorithm algorithm) {
      this.algorithm = algorithm;
      return this;
    }

    public Builder capacity(long capacity) {
      this.capacity = capacity;
      return this;
    }

    public Builder refillRate(long refillRate) {
      this.refillRate = refillRate;
      return this;
    }

    public Builder refillPeriod(RefillPeriod refillPeriod) {
      this.refillPeriod = refillPeriod;
      return this;
    }

    public Builder timeWindow(Duration timeWindow) {
      this.timeWindow = timeWindow;
      return this;
    }

    public Builder failPolicy(FailPolicy failPolicy) {
      this.failPolicy = failPolicy;
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

    public Builder apiPath(String apiPath) {
      this.apiPath = apiPath;
      return this;
    }

    public Builder serviceName(String serviceName) {
      this.serviceName = serviceName;
      return this;
    }

    public Builder blocked(boolean blocked) {
      this.blocked = blocked;
      return this;
    }

    public RateLimitPolicy build() {
      if (id == null || id.isBlank()) {
        id = defaultId();
      }
      return new RateLimitPolicy(
          id,
          scope,
          algorithm,
          capacity,
          refillRate,
          refillPeriod,
          timeWindow,
          failPolicy,
          blankToNull(clientId),
          blankToNull(tenantId),
          blankToNull(apiPath),
          blankToNull(serviceName),
          blocked
      );
    }

    private String defaultId() {
      return String.join(":",
          scope.name(),
          Objects.toString(tenantId, "*"),
          Objects.toString(clientId, "*"),
          Objects.toString(apiPath, "*"));
    }

    private static String blankToNull(String value) {
      if (value == null || value.isBlank()) {
        return null;
      }
      return value.trim();
    }
  }
}
