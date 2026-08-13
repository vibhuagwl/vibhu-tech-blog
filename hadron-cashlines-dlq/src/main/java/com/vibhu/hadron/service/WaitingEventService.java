package com.vibhu.hadron.service;

import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.entity.WaitingEventEntity;
import com.vibhu.hadron.repository.WaitingEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WaitingEventService {

  private final WaitingEventRepository waiting;

  public WaitingEventService(WaitingEventRepository waiting) {
    this.waiting = waiting;
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void park(CashLineEvent event, String payload, int expected) {
    if (waiting.findByEventId(event.eventId()).isPresent()) {
      return;
    }
    WaitingEventEntity row = new WaitingEventEntity();
    row.setEventId(event.eventId());
    row.setCashLineId(event.cashLineId());
    row.setSequenceNumber(event.sequenceNumber());
    row.setEventType(event.eventType().name());
    row.setPayload(payload);
    row.setExpectedSequence(expected);
    waiting.saveAndFlush(row);
  }
}
