package com.vibhu.hadron.service;

import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.domain.CashLineStatus;
import com.vibhu.hadron.domain.DlqStatus;
import com.vibhu.hadron.entity.CashLineStateEntity;
import com.vibhu.hadron.exception.OutOfOrderEventException;
import com.vibhu.hadron.repository.CashLineStateRepository;
import com.vibhu.hadron.repository.DeadLetterMessageRepository;
import com.vibhu.hadron.repository.WaitingEventRepository;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventOrderingService {

  private static final EnumSet<DlqStatus> OPEN =
      EnumSet.of(
          DlqStatus.FAILED,
          DlqStatus.READY_FOR_REPLAY,
          DlqStatus.REPLAYING,
          DlqStatus.REPLAY_FAILED);

  private final CashLineStateRepository states;
  private final WaitingEventRepository waiting;
  private final DeadLetterMessageRepository dlq;
  private final WaitingEventService waitingEvents;

  public EventOrderingService(
      CashLineStateRepository states,
      WaitingEventRepository waiting,
      DeadLetterMessageRepository dlq,
      WaitingEventService waitingEvents) {
    this.states = states;
    this.waiting = waiting;
    this.dlq = dlq;
    this.waitingEvents = waitingEvents;
  }

  @Transactional
  public CashLineStateEntity lockOrCreate(String cashLineId) {
    return states
        .findById(cashLineId)
        .orElseGet(
            () -> {
              CashLineStateEntity created = new CashLineStateEntity();
              created.setCashLineId(cashLineId);
              created.setLastProcessedSequence(0);
              created.setStatus(CashLineStatus.NEW);
              created.setUpdatedAt(Instant.now());
              return states.save(created);
            });
  }

  public int expectedSequence(CashLineStateEntity state) {
    return state.getLastProcessedSequence() + 1;
  }

  public boolean isStale(CashLineEvent event, CashLineStateEntity state) {
    return event.sequenceNumber() <= state.getLastProcessedSequence();
  }

  public boolean hasUnresolvedPriorFailure(String cashLineId) {
    return hasUnresolvedPriorFailure(cashLineId, null);
  }

  public boolean hasUnresolvedPriorFailure(String cashLineId, Long excludeDlqId) {
    if (excludeDlqId == null) {
      return dlq.hasOpenFailure(cashLineId, OPEN);
    }
    return dlq.existsByCashLineIdAndStatusInAndIdNot(cashLineId, OPEN, excludeDlqId);
  }

  @Transactional
  public void validateSequence(CashLineEvent event, String payload) {
    validateSequence(event, payload, null);
  }

  @Transactional
  public void validateSequence(CashLineEvent event, String payload, Long excludeOpenDlqId) {
    CashLineStateEntity state = lockOrCreate(event.cashLineId());
    if (isStale(event, state)) {
      return;
    }
    if (hasUnresolvedPriorFailure(event.cashLineId(), excludeOpenDlqId)) {
      waitingEvents.park(event, payload, expectedSequence(state));
      throw new OutOfOrderEventException(event.cashLineId(), expectedSequence(state), event.sequenceNumber());
    }
    int expected = expectedSequence(state);
    if (event.sequenceNumber() != expected) {
      waitingEvents.park(event, payload, expected);
      throw new OutOfOrderEventException(event.cashLineId(), expected, event.sequenceNumber());
    }
  }

  @Transactional
  public void advance(CashLineEvent event, CashLineStatus status) {
    CashLineStateEntity state = lockOrCreate(event.cashLineId());
    if (event.sequenceNumber() <= state.getLastProcessedSequence()) {
      return;
    }
    state.setLastProcessedSequence(event.sequenceNumber());
    state.setStatus(status);
    state.setBlockedReason(null);
    state.setUpdatedAt(Instant.now());
    states.save(state);
  }

  @Transactional
  public void markBlocked(String cashLineId, String reason) {
    CashLineStateEntity state = lockOrCreate(cashLineId);
    state.setBlockedReason(reason);
    state.setStatus(CashLineStatus.DLQ);
    state.setUpdatedAt(Instant.now());
    states.save(state);
  }

  public java.util.List<com.vibhu.hadron.entity.WaitingEventEntity> waitingFor(String cashLineId) {
    return waiting.findByCashLineIdOrderBySequenceNumberAsc(cashLineId);
  }
}
