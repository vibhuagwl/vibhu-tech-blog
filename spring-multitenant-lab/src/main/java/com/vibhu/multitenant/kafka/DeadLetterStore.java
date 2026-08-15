package com.vibhu.multitenant.kafka;

import com.vibhu.multitenant.outbox.OutboxEventEntity;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class DeadLetterStore {

  private final ConcurrentHashMap<UUID, DlqRecord> store = new ConcurrentHashMap<>();

  public void store(OutboxEventEntity event, String error) {
    DlqRecord record =
        new DlqRecord(
            UUID.randomUUID(),
            event.getTenantId(),
            event.getEventId(),
            "tenant.orders",
            null,
            null,
            event.getPayload(),
            error,
            0,
            "FAILED",
            Instant.now());
    store.put(record.id(), record);
  }

  public List<DlqRecord> list() {
    return new ArrayList<>(store.values());
  }

  public DlqRecord replay(UUID id, TenantEventBus bus) {
    DlqRecord record = store.get(id);
    if (record == null) {
      throw new IllegalArgumentException("DLQ not found");
    }
    // Replay MUST restore tenant context via the payload tenantId (consumer extracts it).
    bus.publish(record.topic(), record.eventId(), record.payload());
    DlqRecord replayed =
        new DlqRecord(
            record.id(),
            record.tenantId(),
            record.eventId(),
            record.topic(),
            record.partition(),
            record.offset(),
            record.payload(),
            record.error(),
            record.retryCount() + 1,
            "REPLAYED",
            record.createdAt());
    store.put(id, replayed);
    return replayed;
  }

  public record DlqRecord(
      UUID id,
      UUID tenantId,
      String eventId,
      String topic,
      Integer partition,
      Long offset,
      String payload,
      String error,
      int retryCount,
      String status,
      Instant createdAt) {}
}
