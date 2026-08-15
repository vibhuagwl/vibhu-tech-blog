package com.vibhu.msp.order;

import org.junit.jupiter.api.Test;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class OrderPostgresIT {

  @Test
  void postgresStartsWhenDockerAvailable() {
    assumeTrue(isDockerAvailable(), "Docker not available — skipping IT");
    try (PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("orders")
        .withUsername("msp")
        .withPassword("msp")) {
      postgres.start();
      assertThat(postgres.isRunning()).isTrue();
      assertThat(postgres.getJdbcUrl()).contains("orders");
    }
  }

  private static boolean isDockerAvailable() {
    try {
      DockerClientFactory.instance().client();
      return true;
    } catch (Exception ex) {
      return false;
    }
  }
}
