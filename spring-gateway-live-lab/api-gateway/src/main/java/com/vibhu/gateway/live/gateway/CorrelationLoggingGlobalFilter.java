package com.vibhu.gateway.live.gateway;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Phase 1 GlobalFilter — correlation ID + latency log. Must stay non-blocking (no Thread.sleep /
 * blocking IO on Netty event loop).
 */
@Component
public class CorrelationLoggingGlobalFilter implements GlobalFilter, Ordered {

  public static final String HEADER = "X-Correlation-ID";
  private static final Logger log = LoggerFactory.getLogger(CorrelationLoggingGlobalFilter.class);

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    long start = System.currentTimeMillis();
    String incoming = exchange.getRequest().getHeaders().getFirst(HEADER);
    String correlationId =
        (incoming == null || incoming.isBlank()) ? UUID.randomUUID().toString() : incoming;

    ServerHttpRequest request =
        exchange.getRequest().mutate().header(HEADER, correlationId).build();
    ServerWebExchange mutated = exchange.mutate().request(request).build();
    mutated.getResponse().getHeaders().set(HEADER, correlationId);

    return chain
        .filter(mutated)
        .doOnSuccess(
            v ->
                log.info(
                    "gateway requestId={} method={} path={} status={} latencyMs={}",
                    correlationId,
                    mutated.getRequest().getMethod(),
                    mutated.getRequest().getURI().getRawPath(),
                    mutated.getResponse().getStatusCode(),
                    System.currentTimeMillis() - start))
        .doOnError(
            err ->
                log.warn(
                    "gateway requestId={} method={} path={} error={} latencyMs={}",
                    correlationId,
                    mutated.getRequest().getMethod(),
                    mutated.getRequest().getURI().getRawPath(),
                    err.toString(),
                    System.currentTimeMillis() - start));
  }

  @Override
  public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE;
  }
}
