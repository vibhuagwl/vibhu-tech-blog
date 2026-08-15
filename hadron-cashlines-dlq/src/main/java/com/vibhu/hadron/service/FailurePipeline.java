package com.vibhu.hadron.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.hadron.classify.ExceptionClassifier;
import com.vibhu.hadron.config.HadronProperties;
import com.vibhu.hadron.config.TopicNames;
import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.domain.EventEnvelope;
import com.vibhu.hadron.domain.RetryDecision;
import com.vibhu.hadron.exception.PoisonMessageException;
import com.vibhu.hadron.kafka.EventPublisher;
import com.vibhu.hadron.metrics.HadronMetrics;
import com.vibhu.hadron.security.PayloadMasker;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class FailurePipeline {

  private static final Logger log = LoggerFactory.getLogger(FailurePipeline.class);

  private final CashLineProcessingService processing;
  private final ExceptionClassifier classifier;
  private final EventPublisher publisher;
  private final DeadLetterMessageService dlq;
  private final HadronProperties properties;
  private final HadronMetrics metrics;
  private final PayloadMasker masker;
  private final ObjectMapper mapper;
  private final BlockingRetryService blockingRetry;

  public FailurePipeline(
      CashLineProcessingService processing,
      ExceptionClassifier classifier,
      EventPublisher publisher,
      DeadLetterMessageService dlq,
      HadronProperties properties,
      HadronMetrics metrics,
      PayloadMasker masker,
      ObjectMapper mapper,
      BlockingRetryService blockingRetry) {
    this.processing = processing;
    this.classifier = classifier;
    this.publisher = publisher;
    this.dlq = dlq;
    this.properties = properties;
    this.metrics = metrics;
    this.masker = masker;
    this.mapper = mapper;
    this.blockingRetry = blockingRetry;
  }

  public void consume(EventEnvelope envelope) {
    try {
      if (properties.getRetry().isBlockingInMemory()) {
        blockingRetry.execute(() -> processing.process(envelope));
      } else {
        processing.process(envelope);
      }
    } catch (Exception ex) {
      handleFailure(envelope, ex);
    }
  }

  public void handleFailure(EventEnvelope envelope, Exception ex) {
    metrics.failed();
    RetryDecision decision = classifier.classify(ex);
    log.warn(
        "CashLine consume failed decision={} retry={} maskedPayload={} ex={}",
        decision,
        envelope.retryCount(),
        masker.mask(envelope.payload()),
        ex.toString());
    if (decision == RetryDecision.IGNORE) {
      return;
    }
    boolean poisonOrPermanent =
        decision == RetryDecision.DLQ_IMMEDIATE || ex instanceof PoisonMessageException;
    int nextRetry = envelope.retryCount() + 1;
    int max = properties.getRetry().getMaxAttempts();
    if (!poisonOrPermanent && nextRetry <= max) {
      routeRetry(envelope, ex, nextRetry);
      return;
    }
    routeDlq(envelope, ex);
  }

  private void routeRetry(EventEnvelope envelope, Exception ex, int nextRetry) {
    metrics.retry();
    List<Duration> delays = properties.getRetry().getDelays();
    Duration delay = delays.get(Math.min(nextRetry, delays.size()) - 1);
    Map<String, String> headers = new HashMap<>(envelope.headers());
    headers.put(TopicNames.HEADER_RETRY_COUNT, Integer.toString(nextRetry));
    headers.put(TopicNames.HEADER_EXCEPTION_TYPE, ex.getClass().getName());
    headers.put(TopicNames.HEADER_FAILURE_REASON, classifier.classify(ex).name());
    headers.put(TopicNames.HEADER_ORIGINAL_TOPIC, envelope.topic());
    headers.put(TopicNames.HEADER_CORRELATION_ID, envelope.correlationId());
    String topic = TopicNames.retryTopic(nextRetry);
    publisher.publishDelayed(topic, envelope.key(), envelope.payload(), headers, delay);
  }

  private void routeDlq(EventEnvelope envelope, Exception ex) {
    metrics.dlq();
    CashLineEvent event = tryParse(envelope);
    dlq.persist(envelope, event, ex);
    Map<String, String> headers = new HashMap<>(envelope.headers());
    headers.put(TopicNames.HEADER_EXCEPTION_TYPE, ex.getClass().getName());
    headers.put(TopicNames.HEADER_FAILURE_REASON, classifier.classify(ex).name());
    publisher.publish(TopicNames.DLQ, envelope.key(), envelope.payload(), headers);
  }

  private CashLineEvent tryParse(EventEnvelope envelope) {
    try {
      return mapper.readValue(envelope.payload(), CashLineEvent.class);
    } catch (Exception ignored) {
      return null;
    }
  }
}
