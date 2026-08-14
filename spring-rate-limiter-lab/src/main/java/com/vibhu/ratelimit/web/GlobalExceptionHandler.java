package com.vibhu.ratelimit.web;

import com.vibhu.ratelimit.api.RateLimitResult;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(RateLimitedException.class)
  public ResponseEntity<Map<String, Object>> limited(RateLimitedException ex) {
    RateLimitResult result = ex.result();
    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
        .header(RateLimitHeaders.LIMIT, Long.toString(result.limit()))
        .header(RateLimitHeaders.REMAINING, Long.toString(result.remainingTokens()))
        .header(RateLimitHeaders.RETRY_AFTER, Long.toString(Math.max(1, result.retryAfterSeconds())))
        .body(Map.of(
            "error", "rate_limited",
            "reason", result.reason(),
            "policy", result.policyId()
        ));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
    return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
  }

  @ExceptionHandler(UnsupportedOperationException.class)
  public ResponseEntity<Map<String, String>> unsupported(UnsupportedOperationException ex) {
    return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of("error", ex.getMessage()));
  }
}
