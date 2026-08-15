package com.vibhu.msp.payment.service;

import com.vibhu.msp.payment.entity.InboxEntity;
import com.vibhu.msp.payment.repository.InboxRepository;
import java.time.Instant;
import java.util.function.Consumer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InboxService {
  private final InboxRepository inboxRepository;

  public InboxService(InboxRepository inboxRepository) {
    this.inboxRepository = inboxRepository;
  }

  @Transactional
  public boolean processIfNew(String messageId, Consumer<Void> handler) {
    if (inboxRepository.existsById(messageId)) {
      return false;
    }
    handler.accept(null);
    InboxEntity inbox = new InboxEntity();
    inbox.setMessageId(messageId);
    inbox.setProcessedAt(Instant.now());
    inboxRepository.save(inbox);
    return true;
  }
}
