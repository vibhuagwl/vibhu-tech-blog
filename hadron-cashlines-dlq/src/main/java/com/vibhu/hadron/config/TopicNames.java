package com.vibhu.hadron.config;

public final class TopicNames {

  public static final String CASHLINE_EVENTS = "cashline-events";
  public static final String RETRY_1 = "cashline-events-retry-1";
  public static final String RETRY_2 = "cashline-events-retry-2";
  public static final String RETRY_3 = "cashline-events-retry-3";
  public static final String DLQ = "cashline-events-dlq";

  public static final String HEADER_RETRY_COUNT = "hadron-retry-count";
  public static final String HEADER_RETRY_AT = "hadron-retry-at";
  public static final String HEADER_FAILURE_REASON = "hadron-failure-reason";
  public static final String HEADER_EXCEPTION_TYPE = "hadron-exception-type";
  public static final String HEADER_CORRELATION_ID = "hadron-correlation-id";
  public static final String HEADER_REPLAY_DLQ_ID = "hadron-replay-dlq-id";
  public static final String HEADER_ORIGINAL_TOPIC = "hadron-original-topic";
  public static final String HEADER_ORIGINAL_PARTITION = "hadron-original-partition";
  public static final String HEADER_ORIGINAL_OFFSET = "hadron-original-offset";

  private TopicNames() {}

  public static String retryTopic(int attempt) {
    return switch (attempt) {
      case 1 -> RETRY_1;
      case 2 -> RETRY_2;
      case 3 -> RETRY_3;
      default -> DLQ;
    };
  }
}
