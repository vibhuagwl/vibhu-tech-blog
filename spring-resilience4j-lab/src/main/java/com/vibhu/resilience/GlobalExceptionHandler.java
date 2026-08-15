package com.vibhu.resilience;

import io.github.resilience4j.bulkhead.BulkheadFullException;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(IllegalArgumentException.class)
  ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
    return ResponseEntity.badRequest()
        .body(Map.of("error", "bad_request", "message", ex.getMessage()));
  }

  @ExceptionHandler(BusinessException.class)
  ResponseEntity<Map<String, String>> business(BusinessException ex) {
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(Map.of("error", "business_rejected", "message", ex.getMessage()));
  }

  @ExceptionHandler(RequestNotPermitted.class)
  ResponseEntity<Map<String, String>> rateLimited() {
    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
        .body(Map.of("error", "rate_limited", "message", "Try later"));
  }

  @ExceptionHandler({
    BulkheadFullException.class,
    CallNotPermittedException.class,
    TimeoutException.class
  })
  ResponseEntity<Map<String, String>> unavailable() {
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
        .body(Map.of("error", "unavailable", "message", "Payment path degraded"));
  }
}
