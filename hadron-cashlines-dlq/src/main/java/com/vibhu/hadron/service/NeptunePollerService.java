package com.vibhu.hadron.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.hadron.config.TopicNames;
import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.domain.EventType;
import com.vibhu.hadron.entity.NeptuneCashLineEntity;
import com.vibhu.hadron.entity.PollerCursorEntity;
import com.vibhu.hadron.kafka.EventPublisher;
import com.vibhu.hadron.repository.NeptuneCashLineRepository;
import com.vibhu.hadron.repository.PollerCursorRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NeptunePollerService {

  public static final String CURSOR_ID = "neptune-cashlines";

  private final NeptuneCashLineRepository neptune;
  private final PollerCursorRepository cursors;
  private final EventPublisher publisher;
  private final ObjectMapper mapper;
  private final com.vibhu.hadron.config.HadronProperties properties;

  public NeptunePollerService(
      NeptuneCashLineRepository neptune,
      PollerCursorRepository cursors,
      EventPublisher publisher,
      ObjectMapper mapper,
      com.vibhu.hadron.config.HadronProperties properties) {
    this.neptune = neptune;
    this.cursors = cursors;
    this.publisher = publisher;
    this.mapper = mapper;
    this.properties = properties;
  }

  @Transactional
  public NeptuneCashLineEntity seed(NeptuneCashLineEntity row) {
    if (row.getUpdatedAt() == null) {
      row.setUpdatedAt(Instant.now());
    }
    return neptune.save(row);
  }

  /**
   * Cursor is (updated_at, id), never updated_at alone. Equal timestamps would skip rows if the
   * poller stored only the last timestamp.
   */
  @Transactional
  public int poll() {
    PollerCursorEntity cursor =
        cursors
            .findById(CURSOR_ID)
            .orElseGet(
                () -> {
                  PollerCursorEntity created = new PollerCursorEntity();
                  created.setId(CURSOR_ID);
                  created.setLastUpdatedAt(Instant.EPOCH);
                  created.setLastId(0L);
                  return cursors.save(created);
                });
    List<NeptuneCashLineEntity> batch =
        neptune.findAfterCursor(
            cursor.getLastUpdatedAt(),
            cursor.getLastId(),
            PageRequest.of(0, properties.getPoller().getBatchSize()));
    NeptuneCashLineEntity last = null;
    for (NeptuneCashLineEntity row : batch) {
      publish(row);
      last = row;
    }
    if (last != null) {
      cursor.setLastUpdatedAt(last.getUpdatedAt());
      cursor.setLastId(last.getId());
      cursor.setUpdatedAt(Instant.now());
      cursors.save(cursor);
    }
    return batch.size();
  }

  public PollerCursorEntity cursor() {
    return cursors.findById(CURSOR_ID).orElseGet(PollerCursorEntity::new);
  }

  private void publish(NeptuneCashLineEntity row) {
    EventType type =
        row.isDeleted() ? EventType.CASHLINE_CANCELLED : EventType.valueOf(row.getEventType());
    String eventId = "neptune-" + row.getId() + "-v" + row.getVersion();
    CashLineEvent event =
        new CashLineEvent(
            eventId,
            row.getCashLineId(),
            type,
            row.getSequenceNumber(),
            row.getVersion(),
            row.getParticipantId(),
            row.getAccountId(),
            row.getCurrency(),
            row.getAmount(),
            "DRAWDOWN",
            row.getUpdatedAt(),
            Map.of("source", "NEPTUNE"));
    try {
      Map<String, String> headers = new HashMap<>();
      headers.put(TopicNames.HEADER_CORRELATION_ID, UUID.randomUUID().toString());
      publisher.publish(
          TopicNames.CASHLINE_EVENTS,
          row.getCashLineId(),
          mapper.writeValueAsString(event),
          headers);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Unable to serialize Neptune CashLine", e);
    }
  }
}
