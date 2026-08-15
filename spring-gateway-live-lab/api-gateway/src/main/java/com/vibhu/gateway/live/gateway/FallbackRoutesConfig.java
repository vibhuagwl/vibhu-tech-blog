package com.vibhu.gateway.live.gateway;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

/**
 * CircuitBreaker fallbacks.
 *
 * <p>Reads (users/orders): DEGRADED is acceptable.
 *
 * <p>Payments: FAIL CLOSED — never return status=SETTLED from a fallback. Money movement requires
 * ledger commit; open circuit → REJECTED/FAILED_CLOSED so clients retry with Idempotency-Key.
 */
@Configuration
public class FallbackRoutesConfig {

  @Bean
  RouterFunction<ServerResponse> fallbackRoutes() {
    return RouterFunctions.route()
        .GET("/fallback/users", req -> degradedRead("user-service"))
        .GET("/fallback/orders", req -> degradedRead("order-service"))
        .POST("/fallback/payments", req -> failClosedPayment())
        .GET("/fallback/payments", req -> failClosedPayment())
        .build();
  }

  private static reactor.core.publisher.Mono<ServerResponse> degradedRead(String downstream) {
    return ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(
            Map.of(
                "status", "DEGRADED",
                "downstream", downstream,
                "message", "Circuit open or downstream timeout — retry later"));
  }

  /**
   * Banking rule: availability must not invent a successful payment. Client should retry POST with
   * the same Idempotency-Key once the ledger is healthy.
   */
  private static reactor.core.publisher.Mono<ServerResponse> failClosedPayment() {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("status", "FAILED_CLOSED");
    body.put("downstream", "payment-service");
    body.put("settled", false);
    body.put(
        "message",
        "Payment NOT settled — circuit open or timeout. Retry with the same Idempotency-Key; never assume success.");
    return ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(body);
  }
}
