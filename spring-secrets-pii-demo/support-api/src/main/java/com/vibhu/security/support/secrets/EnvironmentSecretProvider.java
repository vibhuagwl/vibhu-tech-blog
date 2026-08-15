package com.vibhu.security.support.secrets;

import com.vibhu.security.pii.common.secrets.SecretProvider;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class EnvironmentSecretProvider implements SecretProvider {

  private final Environment environment;

  public EnvironmentSecretProvider(Environment environment) {
    this.environment = environment;
  }

  @Override
  public String require(String key) {
    String value = environment.getProperty(key);
    if (value == null || value.isBlank()) {
      throw new IllegalStateException("Required secret/env missing: " + key);
    }
    return value.trim();
  }

  @Override
  public String optional(String key, String defaultValue) {
    String value = environment.getProperty(key);
    return value == null || value.isBlank() ? defaultValue : value.trim();
  }
}
