package com.vibhu.spring.nplusone.config;

import java.util.concurrent.atomic.AtomicInteger;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.springframework.stereotype.Component;

/** Counts SQL statements for demos/tests (thread-local). */
@Component
public class QueryCountInspector implements StatementInspector {
  private static final ThreadLocal<AtomicInteger> COUNT =
      ThreadLocal.withInitial(AtomicInteger::new);

  @Override
  public String inspect(String sql) {
    COUNT.get().incrementAndGet();
    return sql;
  }

  public static void reset() {
    COUNT.set(new AtomicInteger());
  }

  public static int count() {
    return COUNT.get().get();
  }
}
