package com.vibhu.gateway.live.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.RouteLocator;
import reactor.test.StepVerifier;

@SpringBootTest
class GatewayRouteConfigTest {

  @Autowired RouteLocator routeLocator;

  @Test
  void routesIncludeUsersAndOrders() {
    StepVerifier.create(routeLocator.getRoutes().collectList())
        .assertNext(
            routes -> {
              assertThat(routes).extracting(r -> r.getId()).contains("user-service", "order-service");
            })
        .verifyComplete();
  }
}
