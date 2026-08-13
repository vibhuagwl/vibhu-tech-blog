package com.vibhu.hadron.service;

import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.entity.ProcessedEventEntity;
import com.vibhu.hadron.repository.ProcessedEventRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IdempotencyService {

  private final ProcessedEventRepository processedEvents;

  public IdempotencyService(ProcessedEventRepository processedEvents) {
    this.processedEvents = processedEvents;
  }

  @Transactional(readOnly = true)
  public boolean alreadyProcessed(String eventId) {
    return processedEvents.existsById(eventId);
  }

  @Transactional
  public boolean markProcessed(CashLineEvent event) {
    if (processedEvents.existsById(event.eventId())) {
      return false;
    }
    ProcessedEventEntity row = new ProcessedEventEntity();
    row.setEventId(event.eventId());
    row.setCashLineId(event.cashLineId());
    row.setEventType(event.eventType().name());
    row.setSequenceNumber(event.sequenceNumber());
    row.setStatus("PROCESSED");
    row.setVersion(event.version());
    try {
      processedEvents.saveAndFlush(row);
      return true;
    } catch (DataIntegrityViolationException duplicate) {
      return false;
    }
  }
}
