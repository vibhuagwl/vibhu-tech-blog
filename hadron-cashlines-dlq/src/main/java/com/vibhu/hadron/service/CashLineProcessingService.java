package com.vibhu.hadron.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.domain.CashLineStatus;
import com.vibhu.hadron.domain.EventEnvelope;
import com.vibhu.hadron.entity.CashLineEntity;
import com.vibhu.hadron.entity.CashLineStateEntity;
import com.vibhu.hadron.exception.PoisonMessageException;
import com.vibhu.hadron.metrics.HadronMetrics;
import com.vibhu.hadron.security.PayloadMasker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CashLineProcessingService {

  private static final Logger log = LoggerFactory.getLogger(CashLineProcessingService.class);

  private final ObjectMapper mapper;
  private final CashLineValidator validator;
  private final IdempotencyService idempotency;
  private final EventOrderingService ordering;
  private final CashLineService cashLines;
  private final TransientFailureSimulator transients;
  private final DeadLetterMessageService dlq;
  private final HadronMetrics metrics;
  private final PayloadMasker masker;

  public CashLineProcessingService(
      ObjectMapper mapper,
      CashLineValidator validator,
      IdempotencyService idempotency,
      EventOrderingService ordering,
      CashLineService cashLines,
      TransientFailureSimulator transients,
      DeadLetterMessageService dlq,
      HadronMetrics metrics,
      PayloadMasker masker) {
    this.mapper = mapper;
    this.validator = validator;
    this.idempotency = idempotency;
    this.ordering = ordering;
    this.cashLines = cashLines;
    this.transients = transients;
    this.dlq = dlq;
    this.metrics = metrics;
    this.masker = masker;
  }

  @Transactional
  public ProcessResult process(EventEnvelope envelope) {
    CashLineEvent event = deserialize(envelope);
    MDC.put("eventId", event.eventId());
    MDC.put("cashlineId", event.cashLineId());
    MDC.put("correlationId", envelope.correlationId());
    try {
      return processEvent(envelope, event);
    } finally {
      MDC.remove("eventId");
      MDC.remove("cashlineId");
      MDC.remove("correlationId");
    }
  }

  private ProcessResult processEvent(EventEnvelope envelope, CashLineEvent event) {
    log.info("Processing CashLine event type={} masked={}", event.eventType(), masker.mask(envelope.payload()));
    if (idempotency.alreadyProcessed(event.eventId())) {
      metrics.duplicate();
      maybeCompleteReplay(envelope);
      return ProcessResult.duplicate(event.eventId());
    }
    CashLineStateEntity state = ordering.lockOrCreate(event.cashLineId());
    if (ordering.isStale(event, state)) {
      idempotency.markProcessed(event);
      metrics.duplicate();
      return ProcessResult.stale(event.eventId());
    }
    ordering.validateSequence(event, envelope.payload(), parseReplayDlqId(envelope));
    validator.validate(event);
    transients.maybeFail(event);
    CashLineEntity saved = cashLines.apply(event);
    boolean first = idempotency.markProcessed(event);
    if (!first) {
      metrics.duplicate();
      return ProcessResult.duplicate(event.eventId());
    }
    ordering.advance(event, saved.getStatus());
    maybeCompleteReplay(envelope);
    metrics.processed();
    return ProcessResult.ok(event.eventId(), saved.getStatus());
  }

  private void maybeCompleteReplay(EventEnvelope envelope) {
    String replayId = envelope.replayDlqId();
    if (replayId == null || replayId.isBlank()) {
      return;
    }
    dlq.markReplayed(Long.parseLong(replayId));
  }

  private Long parseReplayDlqId(EventEnvelope envelope) {
    String raw = envelope.replayDlqId();
    if (raw == null || raw.isBlank()) {
      return null;
    }
    try {
      return Long.parseLong(raw);
    } catch (NumberFormatException ignored) {
      return null;
    }
  }

  private CashLineEvent deserialize(EventEnvelope envelope) {
    try {
      return mapper.readValue(envelope.payload(), CashLineEvent.class);
    } catch (JsonProcessingException e) {
      throw new PoisonMessageException("Malformed CashLine JSON", e);
    }
  }

  public record ProcessResult(String outcome, String eventId, CashLineStatus status) {
    static ProcessResult ok(String eventId, CashLineStatus status) {
      return new ProcessResult("PROCESSED", eventId, status);
    }

    static ProcessResult duplicate(String eventId) {
      return new ProcessResult("DUPLICATE", eventId, null);
    }

    static ProcessResult stale(String eventId) {
      return new ProcessResult("STALE", eventId, null);
    }
  }
}
