package com.vibhu.ratelimit.api;

import java.util.Locale;
import java.util.Objects;

/**
 * Redis / in-memory key for one bucket. Hash-tag the tenant so related keys can
 * share a cluster slot if a future multi-key Lua script is needed.
 *
 * <p>Example: {@code rate_limit:{acme}:CLIENT_API:client-123:/payments}
 */
public record RateLimitKey(RateLimitScope scope, String identity) {

  public RateLimitKey {
    Objects.requireNonNull(scope, "scope");
    Objects.requireNonNull(identity, "identity");
  }

  public String redisKey() {
    return "rate_limit:" + identity;
  }

  public static RateLimitKey from(RateLimitPolicy policy, RequestContext ctx) {
    String tenant = ctx.tenantId() != null ? ctx.tenantId() : "_";
    String hashedTenant = "{" + sanitize(tenant) + "}";
    String id = switch (policy.scope()) {
      case GLOBAL -> hashedTenant + ":GLOBAL";
      case TENANT -> hashedTenant + ":TENANT";
      case CLIENT -> hashedTenant + ":CLIENT:" + sanitize(ctx.require(ctx.clientId(), "clientId"));
      case USER -> hashedTenant + ":USER:" + sanitize(ctx.require(ctx.userId(), "userId"));
      case API -> hashedTenant + ":API:" + sanitize(ctx.require(ctx.apiPath(), "apiPath"));
      case IP -> hashedTenant + ":IP:" + sanitize(ctx.require(ctx.ipAddress(), "ipAddress"));
      case SERVICE -> hashedTenant + ":SERVICE:" + sanitize(ctx.require(ctx.serviceName(), "serviceName"));
      case CLIENT_API -> hashedTenant + ":CLIENT_API:"
          + sanitize(ctx.require(ctx.clientId(), "clientId")) + ":"
          + sanitize(ctx.require(ctx.apiPath(), "apiPath"));
      case TENANT_API -> hashedTenant + ":TENANT_API:" + sanitize(ctx.require(ctx.apiPath(), "apiPath"));
    };
    return new RateLimitKey(policy.scope(), id);
  }

  private static String sanitize(String raw) {
    String trimmed = raw.trim().toLowerCase(Locale.ROOT);
    if (trimmed.length() > 128) {
      trimmed = trimmed.substring(0, 128);
    }
    return trimmed.replace(' ', '_');
  }
}
