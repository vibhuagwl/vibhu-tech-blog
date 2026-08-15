package com.vibhu.msp.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;
import static org.springframework.web.reactive.function.server.RequestPredicates.GET;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

@Configuration
public class FallbackConfig {

  @Bean
  RouterFunction<ServerResponse> fallbackRouter() {
    return route(GET("/fallback"), request ->
        ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{\"status\":\"degraded\",\"message\":\"Upstream unavailable\"}"));
  }
}
