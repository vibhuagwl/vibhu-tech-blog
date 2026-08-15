package com.vibhu.gateway.live.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.RouteLocator;
import reactor.test.StepVerifier;

@SpringBootTest(
    properties = {
      "eureka.client.enabled=false",
      "eureka.client.register-with-eureka=false",
      "eureka.client.fetch-registry=false"
    })
class GatewayRouteConfigTest {

  @Autowired RouteLocator routeLocator;

  @Test
  void routesUseLoadBalancedServiceIds() {
    StepVerifier.create(routeLocator.getRoutes().collectList())
        .assertNext(
            routes -> {
              assertThat(routes)
                  .extracting(r -> r.getId())
                  .contains("user-service", "order-service");
              assertThat(routes)
                  .filteredOn(r -> "user-service".equals(r.getId()))
                  .extracting(r -> r.getUri().toString())
                  .containsExactly("lb://user-service");
              assertThat(routes)
                  .filteredOn(r -> "order-service".equals(r.getId()))
                  .extracting(r -> r.getUri().toString())
                  .containsExactly("lb://order-service");
            })
        .verifyComplete();
  }
}
