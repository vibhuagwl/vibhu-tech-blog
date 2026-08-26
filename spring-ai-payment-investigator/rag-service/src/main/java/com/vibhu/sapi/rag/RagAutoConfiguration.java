package com.vibhu.sapi.rag;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan(basePackages = "com.vibhu.sapi.rag")
@EnableConfigurationProperties(RagProperties.class)
public class RagAutoConfiguration {

  /**
   * Explicit startup call site for {@link DocumentSeeder#seed()}.
   *
   * <p>{@code PaymentInvestigatorApplication} {@code @Import}s this class. Spring Boot then
   * runs this {@link ApplicationRunner} after the context is ready (before serving traffic).
   */
  @Bean
  @ConditionalOnProperty(prefix = "app.rag", name = "seed-enabled", havingValue = "true", matchIfMissing = true)
  ApplicationRunner ragDocumentSeedRunner(DocumentSeeder documentSeeder) {
    return args -> documentSeeder.seed();
  }
}
