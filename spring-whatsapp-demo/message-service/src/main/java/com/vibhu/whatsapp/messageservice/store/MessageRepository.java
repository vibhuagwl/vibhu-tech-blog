package com.vibhu.whatsapp.messageservice.store;

import com.vibhu.whatsapp.messageservice.model.MessageRecord;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Repository;

@Repository
public class MessageRepository {
  private final ConcurrentMap<String, MessageRecord> messagesById = new ConcurrentHashMap<>();
  private final ConcurrentMap<String, CopyOnWriteArrayList<String>> messageIdsByConversation =
      new ConcurrentHashMap<>();
  private final ConcurrentMap<String, AtomicLong> serverSeqByConversation =
      new ConcurrentHashMap<>();
  private final ConcurrentMap<IdempotencyKey, String> serverMsgIdByIdempotencyKey =
      new ConcurrentHashMap<>();

  public synchronized MessagePersistResult saveIfAbsent(
      String conversationId,
      String senderId,
      String recipientId,
      String clientMsgId,
      String encryptedPayload) {
    IdempotencyKey idempotencyKey = new IdempotencyKey(senderId, clientMsgId);
    String existingServerMsgId = serverMsgIdByIdempotencyKey.get(idempotencyKey);
    if (existingServerMsgId != null) {
      return new MessagePersistResult(messagesById.get(existingServerMsgId), false);
    }

    long serverSeq =
        serverSeqByConversation
            .computeIfAbsent(conversationId, ignored -> new AtomicLong())
            .incrementAndGet();
    MessageRecord message =
        new MessageRecord(
            "msg_" + UUID.randomUUID(),
            conversationId,
            serverSeq,
            senderId,
            recipientId,
            clientMsgId,
            encryptedPayload,
            Instant.now());

    messagesById.put(message.serverMsgId(), message);
    messageIdsByConversation
        .computeIfAbsent(conversationId, ignored -> new CopyOnWriteArrayList<>())
        .add(message.serverMsgId());
    serverMsgIdByIdempotencyKey.put(idempotencyKey, message.serverMsgId());
    return new MessagePersistResult(message, true);
  }

  public Optional<MessageRecord> findById(String serverMsgId) {
    return Optional.ofNullable(messagesById.get(serverMsgId));
  }

  public List<MessageRecord> findConversationMessagesAfter(String conversationId, long afterSeq) {
    return messageIdsByConversation
        .getOrDefault(conversationId, new CopyOnWriteArrayList<>())
        .stream()
        .map(messagesById::get)
        .filter(message -> message != null && message.serverSeq() > afterSeq)
        .sorted(Comparator.comparingLong(MessageRecord::serverSeq))
        .toList();
  }

  private record IdempotencyKey(String senderId, String clientMsgId) {}
}
