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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lab")
public class LabController {

  private static final List<Map<String, String>> SCENARIOS =
      List.of(
          Map.of("name", "success", "decision", "OK", "what", "Happy-path CREATE"),
          Map.of("name", "poison", "decision", "DLQ_NOW", "what", "Malformed JSON"),
          Map.of("name", "unknown-enum", "decision", "DLQ_NOW", "what", "Unknown eventType enum"),
          Map.of("name", "npe", "decision", "DLQ_NOW", "what", "Forced NullPointerException"),
          Map.of("name", "invalid-amount", "decision", "DLQ_NOW", "what", "Amount <= 0; correct + replay"),
          Map.of("name", "invalid-business", "decision", "DLQ_NOW", "what", "Unknown participant as business error"),
          Map.of("name", "unknown-participant", "decision", "RETRY then DLQ", "what", "Master-data miss (transient)"),
          Map.of("name", "invalid-currency", "decision", "DLQ_NOW", "what", "Currency not in allow-list"),
          Map.of("name", "invalid-account", "decision", "DLQ_NOW", "what", "Account not in allow-list"),
          Map.of("name", "transient-then-ok", "decision", "RETRY", "what", "Timeout twice then success"),
          Map.of("name", "timeout", "decision", "DLQ_AFTER_CAP", "what", "Always timeout → retry-1/2/3 → DLQ"),
          Map.of("name", "deadlock", "decision", "RETRY then DLQ", "what", "Forced deadlock (retryable)"),
          Map.of("name", "duplicate", "decision", "IGNORE", "what", "Same event_id twice"),
          Map.of("name", "out-of-order", "decision", "PARK", "what", "seq 1 then seq 3; park 3"),
          Map.of("name", "stale-event", "decision", "IGNORE", "what", "seq 1 after seq 1 already applied"),
          Map.of("name", "cancelled-then-settle", "decision", "DLQ_NOW", "what", "SETTLE after CANCELLED"),
          Map.of("name", "replay-after-settle", "decision", "DLQ_NOW", "what", "UPDATE after SETTLED"),
          Map.of("name", "currency-mismatch", "decision", "DLQ_NOW", "what", "EUR update on USD CashLine"));

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

  @GetMapping("/scenarios")
  public List<Map<String, String>> scenarios() {
    return SCENARIOS;
  }

  @PostMapping("/scenario/{name}")
  public Map<String, String> scenario(@PathVariable String name) {
    return switch (name) {
      case "success" -> publish(event("CL-OK", "e-ok-1", EventType.CASHLINE_CREATED, 1, "USD", Map.of()));
      case "poison" -> {
        producer.publishRaw("CL-POISON", "{not-json", Map.of());
        yield Map.of("status", "PUBLISHED", "scenario", "poison");
      }
      case "unknown-enum" -> {
        producer.publishRaw(
            "CL-ENUM",
            """
            {"eventId":"e-enum-1","cashLineId":"CL-ENUM","eventType":"CASHLINE_REVERSED","sequenceNumber":1,"version":1,
             "participantId":"P-NEPTUNE","accountId":"ACC-1001","currency":"USD","amount":10,"transactionType":"DRAWDOWN"}
            """,
            Map.of());
        yield Map.of("status", "PUBLISHED", "scenario", "unknown-enum", "eventId", "e-enum-1");
      }
      case "npe" -> publish(event("CL-NPE", "e-npe-1", EventType.CASHLINE_CREATED, 1, "USD", Map.of("forceFailure", "NPE")));
      case "invalid-business" -> publish(unknownParticipant("CL-BAD", "e-bad-1", EventType.CASHLINE_CREATED, 1));
      case "unknown-participant" ->
          publish(event("CL-UP", "e-up-1", EventType.CASHLINE_CREATED, 1, "USD", Map.of("forceFailure", "UNKNOWN_PARTICIPANT")));
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
      case "invalid-currency" ->
          publish(event("CL-CCY", "e-ccy-1", EventType.CASHLINE_CREATED, 1, "XYZ", Map.of()));
      case "invalid-account" ->
          publish(account("CL-ACC", "e-acc-1", EventType.CASHLINE_CREATED, 1, "USD", "ACC-9999"));
      case "transient-then-ok" ->
          publish(event("CL-TMP", "e-tmp-1", EventType.CASHLINE_CREATED, 1, "USD", Map.of("forceFailure", "TRANSIENT_THEN_OK")));
      case "timeout" ->
          publish(event("CL-TO", "e-to-1", EventType.CASHLINE_CREATED, 1, "USD", Map.of("forceFailure", "TIMEOUT")));
      case "deadlock" ->
          publish(event("CL-DL", "e-dl-1", EventType.CASHLINE_CREATED, 1, "USD", Map.of("forceFailure", "DEADLOCK")));
      case "out-of-order" -> {
        publish(event("CL-ORD", "e-ord-1", EventType.CASHLINE_CREATED, 1, "USD", Map.of()));
        publish(event("CL-ORD", "e-ord-3", EventType.CASHLINE_SETTLED, 3, "USD", Map.of()));
        yield Map.of("status", "PUBLISHED", "scenario", "out-of-order");
      }
      case "duplicate" -> {
        CashLineEvent e = event("CL-DUP", "e-dup-1", EventType.CASHLINE_CREATED, 1, "USD", Map.of());
        producer.publish(e, Map.of());
        producer.publish(e, Map.of());
        yield Map.of("status", "PUBLISHED", "eventId", e.eventId());
      }
      case "stale-event" -> {
        publish(event("CL-STALE", "e-stale-1", EventType.CASHLINE_CREATED, 1, "USD", Map.of()));
        publish(event("CL-STALE", "e-stale-old", EventType.CASHLINE_CREATED, 1, "USD", Map.of()));
        yield Map.of("status", "PUBLISHED", "scenario", "stale-event");
      }
      case "cancelled-then-settle" -> {
        publish(event("CL-CAN", "e-can-1", EventType.CASHLINE_CREATED, 1, "USD", Map.of()));
        publish(event("CL-CAN", "e-can-2", EventType.CASHLINE_CANCELLED, 2, "USD", Map.of()));
        publish(event("CL-CAN", "e-can-3", EventType.CASHLINE_SETTLED, 3, "USD", Map.of()));
        yield Map.of("status", "PUBLISHED", "scenario", "cancelled-then-settle");
      }
      case "replay-after-settle" -> {
        publish(event("CL-RAS", "e-ras-1", EventType.CASHLINE_CREATED, 1, "USD", Map.of()));
        publish(event("CL-RAS", "e-ras-2", EventType.CASHLINE_UPDATED, 2, "USD", Map.of()));
        publish(event("CL-RAS", "e-ras-3", EventType.CASHLINE_SETTLED, 3, "USD", Map.of()));
        publish(event("CL-RAS", "e-ras-4", EventType.CASHLINE_UPDATED, 4, "USD", Map.of()));
        yield Map.of("status", "PUBLISHED", "scenario", "replay-after-settle");
      }
      case "currency-mismatch" -> {
        publish(event("CL-MIX", "e-mix-1", EventType.CASHLINE_CREATED, 1, "USD", Map.of()));
        publish(event("CL-MIX", "e-mix-2", EventType.CASHLINE_UPDATED, 2, "EUR", Map.of()));
        yield Map.of("status", "PUBLISHED", "scenario", "currency-mismatch");
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
    Map<String, String> body = new LinkedHashMap<>();
    body.put("status", "PUBLISHED");
    body.put("eventId", event.eventId());
    body.put("cashLineId", event.cashLineId());
    return body;
  }

  private CashLineEvent event(
      String cashLineId, String eventId, EventType type, int seq, String currency, Map<String, String> attributes) {
    return new CashLineEvent(
        eventId,
        cashLineId,
        type,
        seq,
        1,
        "P-NEPTUNE",
        "ACC-1001",
        currency,
        new BigDecimal("100.00"),
        "DRAWDOWN",
        Instant.now(),
        attributes);
  }

  private CashLineEvent unknownParticipant(String cashLineId, String eventId, EventType type, int seq) {
    return new CashLineEvent(
        eventId,
        cashLineId,
        type,
        seq,
        1,
        "UNKNOWN",
        "ACC-1001",
        "USD",
        new BigDecimal("100.00"),
        "DRAWDOWN",
        Instant.now(),
        Map.of());
  }

  private CashLineEvent account(
      String cashLineId, String eventId, EventType type, int seq, String currency, String accountId) {
    return new CashLineEvent(
        eventId,
        cashLineId,
        type,
        seq,
        1,
        "P-NEPTUNE",
        accountId,
        currency,
        new BigDecimal("100.00"),
        "DRAWDOWN",
        Instant.now(),
        Map.of());
  }
}
