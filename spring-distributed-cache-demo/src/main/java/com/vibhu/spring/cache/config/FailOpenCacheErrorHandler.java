package com.vibhu.spring.cache.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;

/** Cache is acceleration — never take down the payment API when Redis blips. */
public class FailOpenCacheErrorHandler implements CacheErrorHandler {
  private static final Logger log = LoggerFactory.getLogger(FailOpenCacheErrorHandler.class);

  @Override
  public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
    log.warn("cache GET failed cache={} key={}", cache.getName(), key, exception);
  }

  @Override
  public void handleCachePutError(
      RuntimeException exception, Cache cache, Object key, Object value) {
    log.warn("cache PUT failed cache={} key={}", cache.getName(), key, exception);
  }

  @Override
  public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
    log.warn("cache EVICT failed cache={} key={}", cache.getName(), key, exception);
  }

  @Override
  public void handleCacheClearError(RuntimeException exception, Cache cache) {
    log.warn("cache CLEAR failed cache={}", cache.getName(), exception);
  }
}
