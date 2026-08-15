package com.vibhu.gateway.live.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.test.context.ActiveProfiles;
import reactor.test.StepVerifier;

/** AWS profile: platform DNS / env URIs — no Eureka, no lb://. */
@SpringBootTest(
    properties = {
      "eureka.client.enabled=false",
      "eureka.client.register-with-eureka=false",
      "eureka.client.fetch-registry=false"
    })
@ActiveProfiles("aws")
class GatewayAwsRouteConfigTest {

  @Autowired RouteLocator routeLocator;

  @Test
  void awsRoutesUseHttpServiceDns() {
    StepVerifier.create(routeLocator.getRoutes().collectList())
        .assertNext(
            routes -> {
              assertThat(routes)
                  .filteredOn(r -> "user-service".equals(r.getId()))
                  .extracting(r -> r.getUri().toString())
                  .containsExactly("http://user-service:8081");
              assertThat(routes)
                  .filteredOn(r -> "order-service".equals(r.getId()))
                  .extracting(r -> r.getUri().toString())
                  .containsExactly("http://order-service:8082");
            })
        .verifyComplete();
  }
}
