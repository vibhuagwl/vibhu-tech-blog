package com.vibhu.hadron.service;

import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.domain.CashLineStatus;
import com.vibhu.hadron.entity.CashLineEntity;
import com.vibhu.hadron.exception.InvalidCashLineException;
import com.vibhu.hadron.repository.CashLineRepository;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CashLineService {

  private final CashLineRepository cashLines;
  private final CashLineStateMachine stateMachine;

  public CashLineService(CashLineRepository cashLines, CashLineStateMachine stateMachine) {
    this.cashLines = cashLines;
    this.stateMachine = stateMachine;
  }

  @Transactional
  public CashLineEntity apply(CashLineEvent event) {
    CashLineEntity entity =
        cashLines
            .findById(event.cashLineId())
            .orElseGet(
                () -> {
                  CashLineEntity created = new CashLineEntity();
                  created.setCashLineId(event.cashLineId());
                  created.setStatus(CashLineStatus.NEW);
                  created.setCreatedAt(Instant.now());
                  return created;
                });

    if (entity.getCurrency() != null
        && event.currency() != null
        && !entity.getCurrency().equals(event.currency())) {
      throw new InvalidCashLineException("Currency mismatch for " + event.cashLineId());
    }
    if (entity.getAccountId() != null
        && event.accountId() != null
        && !entity.getAccountId().equals(event.accountId())) {
      throw new InvalidCashLineException("Account mismatch for " + event.cashLineId());
    }
    if (entity.getStatus() == CashLineStatus.CANCELLED) {
      throw new InvalidCashLineException("CashLine already cancelled: " + event.cashLineId());
    }
    if (entity.getStatus() == CashLineStatus.SETTLED
        && event.eventType().name().contains("UPDATED")) {
      throw new InvalidCashLineException("Replay after settlement is not allowed without ops override");
    }

    CashLineStatus next = stateMachine.next(entity.getStatus(), event.eventType());
    entity.setParticipantId(event.participantId());
    entity.setAccountId(event.accountId());
    entity.setCurrency(event.currency());
    entity.setAmount(event.amount());
    entity.setStatus(next);
    entity.setLastEventId(event.eventId());
    entity.setLastSequence(event.sequenceNumber());
    entity.setUpdatedAt(Instant.now());
    return cashLines.save(entity);
  }
}
