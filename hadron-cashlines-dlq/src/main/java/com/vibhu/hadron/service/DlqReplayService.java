package com.vibhu.hadron.service;

import com.vibhu.hadron.config.TopicNames;
import com.vibhu.hadron.domain.DlqStatus;
import com.vibhu.hadron.entity.AuditLogEntity;
import com.vibhu.hadron.entity.DeadLetterMessageEntity;
import com.vibhu.hadron.exception.ReplayConflictException;
import com.vibhu.hadron.kafka.EventPublisher;
import com.vibhu.hadron.metrics.HadronMetrics;
import com.vibhu.hadron.repository.AuditLogRepository;
import com.vibhu.hadron.repository.DeadLetterMessageRepository;
import java.time.Instant;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class DlqReplayService {

  private static final EnumSet<DlqStatus> REPLAYABLE =
      EnumSet.of(DlqStatus.FAILED, DlqStatus.READY_FOR_REPLAY, DlqStatus.REPLAY_FAILED);

  private final DeadLetterMessageRepository dlq;
  private final EventPublisher publisher;
  private final AuditLogRepository audit;
  private final HadronMetrics metrics;

  public DlqReplayService(
      DeadLetterMessageRepository dlq,
      EventPublisher publisher,
      AuditLogRepository audit,
      HadronMetrics metrics) {
    this.dlq = dlq;
    this.publisher = publisher;
    this.audit = audit;
    this.metrics = metrics;
  }

  @Transactional
  public DeadLetterMessageEntity replay(Long id, String actor) {
    DeadLetterMessageEntity row =
        dlq.findById(id)
            .orElseThrow(() -> new ReplayConflictException("DLQ message not found: " + id));
    if (!REPLAYABLE.contains(row.getStatus())) {
      throw new ReplayConflictException("Concurrent replay or illegal status for DLQ " + id);
    }
    row.setStatus(DlqStatus.REPLAYING);
    row.setReplayCount(row.getReplayCount() + 1);
    row.setReplayActor(actor);
    row.setUpdatedAt(Instant.now());
    try {
      dlq.saveAndFlush(row);
    } catch (OptimisticLockingFailureException ex) {
      throw new ReplayConflictException("Concurrent replay or illegal status for DLQ " + id);
    }
    String key = row.getMessageKey();
    String payload = row.getPayload();
    Long dlqId = row.getId();
    String correlation = row.getCorrelationId() == null ? row.getEventId() : row.getCorrelationId();
    String originalTopic = row.getTopic();
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            Map<String, String> headers = new HashMap<>();
            headers.put(TopicNames.HEADER_REPLAY_DLQ_ID, String.valueOf(dlqId));
            headers.put(TopicNames.HEADER_CORRELATION_ID, correlation);
            headers.put(TopicNames.HEADER_RETRY_COUNT, "0");
            headers.put(TopicNames.HEADER_ORIGINAL_TOPIC, originalTopic);
            publisher.publish(TopicNames.CASHLINE_EVENTS, key, payload, headers);
          }
        });
    audit(actor, "REPLAY", String.valueOf(id), "cashline=" + row.getCashLineId());
    metrics.replay();
    return row;
  }

  @Transactional
  public List<DeadLetterMessageEntity> replayCashLine(String cashLineId, String actor) {
    return dlq.findByCashLineIdOrderByCreatedAtAsc(cashLineId).stream()
        .filter(item -> REPLAYABLE.contains(item.getStatus()))
        .map(item -> replay(item.getId(), actor))
        .toList();
  }

  @Transactional
  public List<DeadLetterMessageEntity> replayBatch(List<Long> ids, String actor) {
    return ids.stream().map(id -> replay(id, actor)).toList();
  }

  private void audit(String actor, String action, String entityId, String detail) {
    AuditLogEntity entry = new AuditLogEntity();
    entry.setActor(actor);
    entry.setAction(action);
    entry.setEntityType("DEAD_LETTER");
    entry.setEntityId(entityId);
    entry.setDetail(detail);
    audit.save(entry);
  }
}
