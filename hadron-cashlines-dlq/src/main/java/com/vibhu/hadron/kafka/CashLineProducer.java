package com.vibhu.hadron.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.hadron.config.TopicNames;
import com.vibhu.hadron.domain.CashLineEvent;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CashLineProducer {

  private final EventPublisher publisher;
  private final ObjectMapper mapper;

  public CashLineProducer(EventPublisher publisher, ObjectMapper mapper) {
    this.publisher = publisher;
    this.mapper = mapper;
  }

  public void publish(CashLineEvent event, Map<String, String> extraHeaders) {
    try {
      Map<String, String> headers = extraHeaders == null ? new HashMap<>() : new HashMap<>(extraHeaders);
      headers.putIfAbsent(TopicNames.HEADER_CORRELATION_ID, UUID.randomUUID().toString());
      publisher.publish(
          TopicNames.CASHLINE_EVENTS,
          event.cashLineId(),
          mapper.writeValueAsString(event),
          headers);
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Cannot serialize CashLine event", e);
    }
  }

  public void publishRaw(String cashLineId, String payload, Map<String, String> headers) {
    Map<String, String> next = headers == null ? new HashMap<>() : new HashMap<>(headers);
    next.putIfAbsent(TopicNames.HEADER_CORRELATION_ID, UUID.randomUUID().toString());
    publisher.publish(TopicNames.CASHLINE_EVENTS, cashLineId, payload, next);
  }
}
