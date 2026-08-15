package com.vibhu.gateway.live.gateway;

import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

/**
 * CircuitBreaker fallbacks — fail fast with a stable JSON contract when
 * downstream is open/timeout instead of cascading latency to clients.
 */
@Configuration
public class FallbackRoutesConfig {

  @Bean
  RouterFunction<ServerResponse> fallbackRoutes() {
    return RouterFunctions.route()
        .GET("/fallback/users", req -> degraded("user-service"))
        .GET("/fallback/orders", req -> degraded("order-service"))
        .build();
  }

  private static reactor.core.publisher.Mono<ServerResponse> degraded(String downstream) {
    return ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(
            Map.of(
                "status", "DEGRADED",
                "downstream", downstream,
                "message", "Circuit open or downstream timeout — retry later"));
  }
}
