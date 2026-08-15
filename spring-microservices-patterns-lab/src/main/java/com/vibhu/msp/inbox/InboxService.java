package com.vibhu.msp.inbox;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Inbox pattern — idempotent message processing. Maps to curriculum Part 08. */
@Service
public class InboxService {

  private final Map<String, Object> processedMessageIds = new ConcurrentHashMap<>();

  @Transactional
  public boolean processIfNew(String messageId, Runnable handler) {
    Object placeholder = new Object();
    Object previous = processedMessageIds.putIfAbsent(messageId, placeholder);
    if (previous != null) {
      return false;
    }
    try {
      handler.run();
      processedMessageIds.put(messageId, Instant.now());
      return true;
    } catch (RuntimeException ex) {
      processedMessageIds.remove(messageId);
      throw ex;
    }
  }

  public boolean alreadyProcessed(String messageId) {
    return processedMessageIds.containsKey(messageId);
  }

  public int processedCount() {
    return processedMessageIds.size();
  }
}
