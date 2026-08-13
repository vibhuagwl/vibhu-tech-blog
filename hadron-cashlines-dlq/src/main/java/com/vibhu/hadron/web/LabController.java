package com.vibhu.hadron.web;

import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.domain.EventType;
import com.vibhu.hadron.kafka.CashLineProducer;
import com.vibhu.hadron.repository.CashLineRepository;
import com.vibhu.hadron.repository.DeadLetterMessageRepository;
import com.vibhu.hadron.repository.ProcessedEventRepository;
import com.vibhu.hadron.service.TransientFailureSimulator;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lab")
public class LabController {

  private final CashLineProducer producer;
  private final CashLineRepository cashLines;
  private final DeadLetterMessageRepository dlq;
  private final ProcessedEventRepository processed;
  private final TransientFailureSimulator transients;

  public LabController(
      CashLineProducer producer,
      CashLineRepository cashLines,
      DeadLetterMessageRepository dlq,
      ProcessedEventRepository processed,
      TransientFailureSimulator transients) {
    this.producer = producer;
    this.cashLines = cashLines;
    this.dlq = dlq;
    this.processed = processed;
    this.transients = transients;
  }

  @GetMapping("/status")
  public Map<String, Object> status() {
    return Map.of(
        "cashLines", cashLines.count(),
        "processedEvents", processed.count(),
        "dlq", dlq.count());
  }

  @PostMapping("/scenario/{name}")
  public Map<String, String> scenario(@PathVariable String name) {
    return switch (name) {
      case "success" -> publish(event("CL-OK", "e-ok-1", EventType.CASHLINE_CREATED, 1, Map.of()));
      case "poison" -> {
        producer.publishRaw("CL-POISON", "{not-json", Map.of());
        yield Map.of("status", "PUBLISHED", "scenario", "poison");
      }
      case "invalid-business" ->
          publish(event("CL-BAD", "e-bad-1", EventType.CASHLINE_CREATED, 1, Map.of("forceFailure", "")));
      case "invalid-amount" -> {
        CashLineEvent e =
            new CashLineEvent(
                "e-amt-1",
                "CL-AMT",
                EventType.CASHLINE_CREATED,
                1,
                1,
                "P-NEPTUNE",
                "ACC-1001",
                "USD",
                new BigDecimal("-10"),
                "DRAWDOWN",
                Instant.now(),
                Map.of());
        producer.publish(e, Map.of());
        yield Map.of("status", "PUBLISHED", "eventId", e.eventId());
      }
      case "transient-then-ok" ->
          publish(event("CL-TMP", "e-tmp-1", EventType.CASHLINE_CREATED, 1, Map.of("forceFailure", "TRANSIENT_THEN_OK")));
      case "timeout" ->
          publish(event("CL-TO", "e-to-1", EventType.CASHLINE_CREATED, 1, Map.of("forceFailure", "TIMEOUT")));
      case "out-of-order" -> {
        publish(event("CL-ORD", "e-ord-1", EventType.CASHLINE_CREATED, 1, Map.of()));
        publish(event("CL-ORD", "e-ord-3", EventType.CASHLINE_SETTLED, 3, Map.of()));
        yield Map.of("status", "PUBLISHED", "scenario", "out-of-order");
      }
      case "duplicate" -> {
        CashLineEvent e = event("CL-DUP", "e-dup-1", EventType.CASHLINE_CREATED, 1, Map.of());
        producer.publish(e, Map.of());
        producer.publish(e, Map.of());
        yield Map.of("status", "PUBLISHED", "eventId", e.eventId());
      }
      default -> Map.of("status", "UNKNOWN_SCENARIO", "name", name);
    };
  }

  @PostMapping("/reset-transients")
  public Map<String, String> reset() {
    transients.reset();
    return Map.of("status", "RESET");
  }

  private Map<String, String> publish(CashLineEvent event) {
    producer.publish(event, Map.of());
    return Map.of("status", "PUBLISHED", "eventId", event.eventId(), "cashLineId", event.cashLineId());
  }

  private CashLineEvent event(
      String cashLineId, String eventId, EventType type, int seq, Map<String, String> attributes) {
    String participant = "invalid-business".equals(cashLineId) ? "UNKNOWN" : "P-NEPTUNE";
    if ("CL-BAD".equals(cashLineId)) {
      participant = "UNKNOWN";
    }
    return new CashLineEvent(
        eventId,
        cashLineId,
        type,
        seq,
        1,
        participant,
        "ACC-1001",
        "USD",
        new BigDecimal("100.00"),
        "DRAWDOWN",
        Instant.now(),
        attributes);
  }
}
