package com.vibhu.msp.inbox;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Inbox pattern — idempotent message processing. Maps to curriculum Part 08. */
@Service
public class InboxService {

  private final Map<String, Instant> processedMessageIds = new ConcurrentHashMap<>();

  @Transactional
  public boolean processIfNew(String messageId, Runnable handler) {
    if (processedMessageIds.containsKey(messageId)) {
      return false;
    }
    handler.run();
    processedMessageIds.put(messageId, Instant.now());
    return true;
  }

  public boolean alreadyProcessed(String messageId) {
    return processedMessageIds.containsKey(messageId);
  }

  public int processedCount() {
    return processedMessageIds.size();
  }
}
