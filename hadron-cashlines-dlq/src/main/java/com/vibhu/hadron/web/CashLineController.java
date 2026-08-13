package com.vibhu.hadron.web;

import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.dto.PublishEventRequest;
import com.vibhu.hadron.entity.CashLineEntity;
import com.vibhu.hadron.kafka.CashLineProducer;
import com.vibhu.hadron.repository.CashLineRepository;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cashlines")
public class CashLineController {

  private final CashLineProducer producer;
  private final CashLineRepository cashLines;

  public CashLineController(CashLineProducer producer, CashLineRepository cashLines) {
    this.producer = producer;
    this.cashLines = cashLines;
  }

  @PostMapping("/events")
  public Map<String, String> publish(@Valid @RequestBody PublishEventRequest request) {
    CashLineEvent event =
        new CashLineEvent(
            request.eventId(),
            request.cashLineId(),
            request.eventType(),
            request.sequenceNumber(),
            request.version(),
            request.participantId(),
            request.accountId(),
            request.currency(),
            request.amount(),
            request.transactionType(),
            request.occurredAt(),
            request.attributes());
    producer.publish(event, Map.of());
    return Map.of("status", "PUBLISHED", "eventId", event.eventId(), "cashLineId", event.cashLineId());
  }

  @PostMapping("/events/raw")
  public Map<String, String> publishRaw(@RequestBody Map<String, String> body) {
    String cashLineId = body.getOrDefault("cashLineId", "UNKNOWN");
    String payload = body.getOrDefault("payload", "{");
    producer.publishRaw(cashLineId, payload, Map.of());
    return Map.of("status", "PUBLISHED_RAW", "cashLineId", cashLineId);
  }

  @GetMapping("/{id}")
  public ResponseEntity<CashLineEntity> get(@PathVariable String id) {
    return cashLines.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
  }
}
