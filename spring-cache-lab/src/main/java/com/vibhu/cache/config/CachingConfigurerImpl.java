package com.vibhu.cache.config;

import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CachingConfigurerImpl implements CachingConfigurer {

  @Override
  public CacheErrorHandler errorHandler() {
    return new FailOpenCacheErrorHandler();
  }
}
