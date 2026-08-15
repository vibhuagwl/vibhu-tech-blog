package com.vibhu.msp.gateway.filter;

import com.vibhu.msp.common.MspHeaders;
import java.util.UUID;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class CorrelationIdGatewayFilter implements GlobalFilter, Ordered {

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    ServerHttpRequest request = exchange.getRequest();
    String headerValue = request.getHeaders().getFirst(MspHeaders.CORRELATION_ID);
    final String correlationId = (headerValue == null || headerValue.isBlank())
        ? UUID.randomUUID().toString()
        : headerValue;
    ServerHttpRequest mutated = request.mutate()
        .header(MspHeaders.CORRELATION_ID, correlationId)
        .build();
    return chain.filter(exchange.mutate().request(mutated).build())
        .doOnSuccess(v -> exchange.getResponse().getHeaders().add(MspHeaders.CORRELATION_ID, correlationId));
  }

  @Override
  public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE;
  }
}
