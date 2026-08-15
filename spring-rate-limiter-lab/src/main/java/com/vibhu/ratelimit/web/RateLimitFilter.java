package com.vibhu.ratelimit.web;

import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.api.RateLimiter;
import com.vibhu.ratelimit.api.RequestContext;
import com.vibhu.ratelimit.config.RateLimitProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Application-level enforcement. Gateway-level limiting still belongs in front for coarse IP/WAF
 * protection; this filter uses authenticated identity headers (lab: X-User-Id / X-Client-Id /
 * X-Tenant-Id) that production would take from JWT.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class RateLimitFilter extends OncePerRequestFilter {

  private final RateLimiter rateLimiter;
  private final RateLimitProperties properties;

  public RateLimitFilter(RateLimiter rateLimiter, RateLimitProperties properties) {
    this.rateLimiter = rateLimiter;
    this.properties = properties;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    if (!properties.filterEnabled()) {
      return true;
    }
    String path = request.getRequestURI();
    return path.startsWith("/actuator")
        || path.startsWith("/api/rate-limits")
        || path.startsWith("/error");
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    RequestContext ctx =
        RequestContext.builder()
            .userId(header(request, "X-User-Id"))
            .clientId(header(request, "X-Client-Id"))
            .tenantId(header(request, "X-Tenant-Id"))
            .ipAddress(clientIp(request))
            .apiPath(normalize(request.getRequestURI()))
            .httpMethod(request.getMethod())
            .serviceName(header(request, "X-Service-Name"))
            .build();
    RateLimitResult result = rateLimiter.allow(ctx);
    RateLimitHeaders.apply(response, result);
    if (!result.allowed()) {
      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
      response.setContentType("application/json");
      response
          .getWriter()
          .write(
              """
          {"error":"rate_limited","reason":"%s","policy":"%s","retryAfterSeconds":%d}
          """
                  .formatted(
                      result.reason(), result.policyId(), Math.max(1, result.retryAfterSeconds())));
      return;
    }
    filterChain.doFilter(request, response);
  }

  private static String header(HttpServletRequest request, String name) {
    String value = request.getHeader(name);
    return value == null || value.isBlank() ? null : value;
  }

  private static String clientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      int comma = forwarded.indexOf(',');
      return comma > 0 ? forwarded.substring(0, comma).trim() : forwarded.trim();
    }
    return request.getRemoteAddr();
  }

  private static String normalize(String uri) {
    if (uri == null) {
      return "/";
    }
    if (uri.length() > 1 && uri.endsWith("/")) {
      return uri.substring(0, uri.length() - 1);
    }
    return uri;
  }
}
