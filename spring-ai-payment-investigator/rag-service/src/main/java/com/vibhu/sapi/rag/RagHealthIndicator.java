package com.vibhu.sapi.rag;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnClass(HealthIndicator.class)
public class RagHealthIndicator implements HealthIndicator {

  private final DocumentSeeder documentSeeder;
  private final RagProperties properties;

  public RagHealthIndicator(DocumentSeeder documentSeeder, RagProperties properties) {
    this.documentSeeder = documentSeeder;
    this.properties = properties;
  }

  @Override
  public Health health() {
    int count = documentSeeder.indexedCount();
    if (properties.seedEnabled() && properties.failOnEmpty() && count == 0) {
      return Health.down()
          .withDetail("indexedDocuments", count)
          .withDetail("docsPattern", properties.docsPattern())
          .build();
    }
    return Health.up()
        .withDetail("indexedDocuments", count)
        .withDetail("docsPattern", properties.docsPattern())
        .build();
  }
}
