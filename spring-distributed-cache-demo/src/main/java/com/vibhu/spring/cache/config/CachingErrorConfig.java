package com.vibhu.spring.cache.config;

import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CachingErrorConfig implements CachingConfigurer {
  private final CacheErrorHandler handler;

  public CachingErrorConfig(CacheErrorHandler handler) {
    this.handler = handler;
  }

  @Override
  public CacheErrorHandler errorHandler() {
    return handler;
  }
}
