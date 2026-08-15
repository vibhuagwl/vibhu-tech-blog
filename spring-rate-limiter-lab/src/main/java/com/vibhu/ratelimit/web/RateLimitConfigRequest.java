package com.vibhu.ratelimit.web;

import com.vibhu.ratelimit.api.RateLimitAlgorithm;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitScope;
import com.vibhu.ratelimit.api.RefillPeriod;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RateLimitConfigRequest(
    @NotBlank String id,
    @NotNull RateLimitScope scope,
    RateLimitAlgorithm algorithm,
    String clientId,
    String tenantId,
    String api,
    String serviceName,
    @Min(1) long capacity,
    @Min(1) long refillRate,
    RefillPeriod refillPeriod,
    String failPolicy,
    boolean blocked) {
  public RateLimitPolicy toPolicy() {
    return RateLimitPolicy.builder()
        .id(id)
        .scope(scope)
        .algorithm(algorithm == null ? RateLimitAlgorithm.TOKEN_BUCKET : algorithm)
        .clientId(clientId)
        .tenantId(tenantId)
        .apiPath(api)
        .serviceName(serviceName)
        .capacity(capacity)
        .refillRate(refillRate)
        .refillPeriod(refillPeriod == null ? RefillPeriod.MINUTE : refillPeriod)
        .failPolicy(
            failPolicy == null ? null : com.vibhu.ratelimit.api.FailPolicy.valueOf(failPolicy))
        .blocked(blocked)
        .build();
  }
}
