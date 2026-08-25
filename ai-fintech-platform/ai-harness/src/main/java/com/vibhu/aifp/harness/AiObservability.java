package com.vibhu.aifp.harness;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AiObservability {

  private static final Logger log = LoggerFactory.getLogger(AiObservability.class);

  public record Span(String name, long durationMs, Instant startedAt) {}

  private final CopyOnWriteArrayList<Span> spans = new CopyOnWriteArrayList<>();

  public <T> T record(String name, java.util.function.Supplier<T> action) {
    Instant start = Instant.now();
    long t0 = System.nanoTime();
    try {
      return action.get();
    } finally {
      long durationMs = (System.nanoTime() - t0) / 1_000_000;
      Span span = new Span(name, durationMs, start);
      spans.add(span);
      log.info("ai-span name={} durationMs={}", name, durationMs);
    }
  }

  public List<Span> spans() {
    return new ArrayList<>(spans);
  }

  public void clear() {
    spans.clear();
  }
}
