package com.vibhu.hadron.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.hadron.config.HadronProperties;
import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.domain.DlqStatus;
import com.vibhu.hadron.domain.EventEnvelope;
import com.vibhu.hadron.entity.DeadLetterMessageEntity;
import com.vibhu.hadron.exception.HadronException;
import com.vibhu.hadron.repository.DeadLetterMessageRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeadLetterMessageService {

  private static final Logger log = LoggerFactory.getLogger(DeadLetterMessageService.class);

  private final DeadLetterMessageRepository repository;
  private final HadronProperties properties;
  private final ObjectMapper mapper;
  private final EventOrderingService ordering;

  public DeadLetterMessageService(
      DeadLetterMessageRepository repository,
      HadronProperties properties,
      ObjectMapper mapper,
      EventOrderingService ordering) {
    this.repository = repository;
    this.properties = properties;
    this.mapper = mapper;
    this.ordering = ordering;
  }

  /**
   * REQUIRES_NEW so a DLQ insert survives rollback of the failed CashLine transaction.
   * Unique(event_id) and unique(topic,partition,offset) make this idempotent if Kafka redelivers
   * after a DLQ write but before offset commit.
   */
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public DeadLetterMessageEntity persist(
      EventEnvelope envelope, CashLineEvent event, Throwable error) {
    Optional<DeadLetterMessageEntity> existing =
        repository.findByEventId(safeEventId(event, envelope));
    if (existing.isPresent()) {
      DeadLetterMessageEntity row = existing.get();
      row.setLastFailedAt(Instant.now());
      row.setRetryCount(Math.max(row.getRetryCount(), envelope.retryCount()));
      row.setExceptionType(error.getClass().getName());
      row.setExceptionMessage(trim(error.getMessage()));
      row.setUpdatedAt(Instant.now());
      if (row.getStatus() == DlqStatus.REPLAYED || row.getStatus() == DlqStatus.RESOLVED) {
        row.setStatus(DlqStatus.FAILED);
      }
      return repository.save(row);
    }
    DeadLetterMessageEntity row = new DeadLetterMessageEntity();
    row.setMessageId(UUID.randomUUID().toString());
    row.setEventId(safeEventId(event, envelope));
    row.setCashLineId(event == null ? envelope.key() : event.cashLineId());
    row.setEventType(event == null ? null : event.eventType().name());
    row.setTopic(envelope.topic());
    row.setPartitionNo(envelope.partition());
    row.setOffsetNo(envelope.offset());
    row.setMessageKey(envelope.key());
    row.setPayload(truncate(envelope.payload()));
    row.setHeaders(writeHeaders(envelope));
    row.setExceptionType(error.getClass().getName());
    row.setExceptionMessage(trim(error.getMessage()));
    row.setFailureReason(reason(error));
    row.setRetryCount(envelope.retryCount());
    row.setStatus(DlqStatus.FAILED);
    row.setCorrelationId(envelope.correlationId());
    Instant now = Instant.now();
    row.setFirstFailedAt(now);
    row.setLastFailedAt(now);
    row.setCreatedAt(now);
    row.setUpdatedAt(now);
    try {
      DeadLetterMessageEntity saved = repository.saveAndFlush(row);
      ordering.markBlocked(saved.getCashLineId(), saved.getFailureReason());
      return saved;
    } catch (DataIntegrityViolationException duplicate) {
      log.info("Idempotent DLQ write for eventId={}", row.getEventId());
      return repository.findByEventId(row.getEventId()).orElseThrow();
    }
  }

  @Transactional
  public Optional<DeadLetterMessageEntity> find(Long id) {
    return repository.findById(id);
  }

  @Transactional(readOnly = true)
  public List<DeadLetterMessageEntity> list() {
    return repository.findAll();
  }

  @Transactional(readOnly = true)
  public List<DeadLetterMessageEntity> byCashLine(String cashLineId) {
    return repository.findByCashLineIdOrderByCreatedAtAsc(cashLineId);
  }

  @Transactional
  public void markReplayed(Long id) {
    repository
        .findById(id)
        .ifPresent(
            row -> {
              row.setStatus(DlqStatus.REPLAYED);
              row.setReplayedAt(Instant.now());
              row.setUpdatedAt(Instant.now());
              repository.save(row);
            });
  }

  @Transactional
  public void markReplayFailed(Long id, String message) {
    repository
        .findById(id)
        .ifPresent(
            row -> {
              row.setStatus(DlqStatus.REPLAY_FAILED);
              row.setExceptionMessage(trim(message));
              row.setLastFailedAt(Instant.now());
              row.setUpdatedAt(Instant.now());
              repository.save(row);
            });
  }

  @Transactional
  public DeadLetterMessageEntity replacePayload(Long id, String payload, String actor) {
    DeadLetterMessageEntity row = repository.findById(id).orElseThrow();
    row.setPayload(truncate(payload));
    row.setStatus(DlqStatus.READY_FOR_REPLAY);
    row.setReplayActor(actor);
    row.setUpdatedAt(Instant.now());
    return repository.save(row);
  }

  @Transactional
  public DeadLetterMessageEntity resolve(Long id, String actor) {
    DeadLetterMessageEntity row = repository.findById(id).orElseThrow();
    row.setStatus(DlqStatus.RESOLVED);
    row.setResolvedAt(Instant.now());
    row.setReplayActor(actor);
    row.setUpdatedAt(Instant.now());
    return repository.save(row);
  }

  @Transactional
  public DeadLetterMessageEntity ignore(Long id, String actor) {
    DeadLetterMessageEntity row = repository.findById(id).orElseThrow();
    row.setStatus(DlqStatus.IGNORED);
    row.setResolvedAt(Instant.now());
    row.setReplayActor(actor);
    row.setUpdatedAt(Instant.now());
    return repository.save(row);
  }

  private String safeEventId(CashLineEvent event, EventEnvelope envelope) {
    if (event != null && event.eventId() != null) {
      return event.eventId();
    }
    return envelope.topic() + "-" + envelope.partition() + "-" + envelope.offset();
  }

  private String reason(Throwable error) {
    if (error instanceof HadronException hadron) {
      return hadron.category().name();
    }
    return error.getClass().getSimpleName();
  }

  private String trim(String message) {
    if (message == null) {
      return null;
    }
    return message.length() > 2000 ? message.substring(0, 2000) : message;
  }

  private String truncate(String payload) {
    if (payload == null) {
      return "";
    }
    int max = properties.getDlq().getPayloadMaxBytes();
    if (payload.length() <= max) {
      return payload;
    }
    return payload.substring(0, max);
  }

  private String writeHeaders(EventEnvelope envelope) {
    try {
      return mapper.writeValueAsString(envelope.headers());
    } catch (JsonProcessingException e) {
      return "{}";
    }
  }
}
