package com.vibhu.security.attacks.ddos;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Tiny in-memory fixed-window rate limiter for /ddos/** — demo of application-layer DDoS defense.
 * Production: use Redis/Bucket4j/API gateway/WAF/CDN instead of a single-node map.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class IpRateLimitFilter extends OncePerRequestFilter {
  private final RateLimitProperties props;
  private final Map<String, Window> windows = new ConcurrentHashMap<>();

  public IpRateLimitFilter(RateLimitProperties props) {
    this.props = props;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    return path == null || !path.startsWith("/ddos/");
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String ip = clientIp(request);
    long now = Instant.now().getEpochSecond();
    long bucket = now / Math.max(1, props.windowSeconds());
    String key = ip + ":" + bucket;

    Window window = windows.compute(key, (k, existing) -> {
      if (existing == null) {
        return new Window(new AtomicInteger(1));
      }
      existing.count.incrementAndGet();
      return existing;
    });

    // opportunistic cleanup of other buckets for this process
    windows.keySet().removeIf(k -> !k.endsWith(":" + bucket) && k.startsWith(ip + ":"));

    if (window.count.get() > props.requestsPerWindow()) {
      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
      response.setHeader("Retry-After", String.valueOf(props.windowSeconds()));
      response.setContentType("application/json");
      response.getWriter().write(
          "{\"error\":\"rate_limited\",\"limit\":"
              + props.requestsPerWindow()
              + ",\"windowSeconds\":"
              + props.windowSeconds()
              + "}");
      return;
    }

    filterChain.doFilter(request, response);
  }

  private static String clientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
  }

  private record Window(AtomicInteger count) {}
}
