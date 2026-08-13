package com.vibhu.hadron.domain;

import java.util.HashMap;
import java.util.Map;

public record EventEnvelope(
    String topic,
    int partition,
    long offset,
    String key,
    String payload,
    Map<String, String> headers,
    int retryCount) {

  public EventEnvelope {
    if (headers == null) {
      headers = Map.of();
    }
  }

  public EventEnvelope withRetry(int nextRetry, String nextTopic) {
    Map<String, String> next = new HashMap<>(headers);
    next.put("hadron-retry-count", Integer.toString(nextRetry));
    return new EventEnvelope(nextTopic, partition, offset, key, payload, next, nextRetry);
  }

  public String header(String name) {
    return headers.get(name);
  }

  public String correlationId() {
    return headers.getOrDefault("hadron-correlation-id", eventHint());
  }

  public String replayDlqId() {
    return headers.get("hadron-replay-dlq-id");
  }

  private String eventHint() {
    return key == null ? "unknown" : key;
  }
}
