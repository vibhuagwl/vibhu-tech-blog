package com.vibhu.hadron.service;

import com.vibhu.hadron.config.HadronProperties;
import java.time.Duration;
import java.util.List;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Strategy 1: in-memory / thread-blocking retry. Dangerous for Kafka consumers because Thread.sleep
 * holds the consumer thread, stalls max.poll.interval, and can trigger rebalances. Kept as an
 * explicit anti-pattern behind hadron.retry.blocking-in-memory=true.
 */
@Service
public class BlockingRetryService {

  private static final Logger log = LoggerFactory.getLogger(BlockingRetryService.class);

  private final HadronProperties properties;

  public BlockingRetryService(HadronProperties properties) {
    this.properties = properties;
  }

  public <T> T execute(Supplier<T> action) {
    List<Duration> delays = properties.getRetry().getDelays();
    int attempts = properties.getRetry().getMaxAttempts();
    RuntimeException last = null;
    for (int i = 0; i <= attempts; i++) {
      try {
        return action.get();
      } catch (RuntimeException ex) {
        last = ex;
        if (i >= attempts) {
          break;
        }
        Duration wait = delays.get(Math.min(i, delays.size() - 1));
        log.warn("Blocking retry {}/{} sleeping {}", i + 1, attempts, wait);
        try {
          Thread.sleep(wait.toMillis());
        } catch (InterruptedException ie) {
          Thread.currentThread().interrupt();
          throw ex;
        }
      }
    }
    throw last;
  }
}
