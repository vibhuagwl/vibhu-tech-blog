package com.vibhu.gateway.live.gateway;

import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

/** Public endpoint on the gateway itself — no downstream hop. */
@Configuration
public class PublicRoutesConfig {

  @Bean
  RouterFunction<ServerResponse> publicRoutes() {
    return RouterFunctions.route()
        .GET(
            "/api/public/ping",
            req ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "status", "ok",
                            "service", "api-gateway",
                            "requestId", UUID.randomUUID().toString())))
        .build();
  }
}
