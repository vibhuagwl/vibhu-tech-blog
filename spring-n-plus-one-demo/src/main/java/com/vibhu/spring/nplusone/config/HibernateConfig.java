package com.vibhu.spring.nplusone.config;

import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HibernateConfig {
  @Bean
  HibernatePropertiesCustomizer hibernatePropertiesCustomizer(QueryCountInspector inspector) {
    return props -> props.put("hibernate.session_factory.statement_inspector", inspector);
  }
}
