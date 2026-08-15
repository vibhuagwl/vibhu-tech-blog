package com.vibhu.whatsapp.messageservice.store;

import com.vibhu.whatsapp.common.dto.DeliveryAttemptStatus;
import com.vibhu.whatsapp.messageservice.model.DeliveryAttemptRecord;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Repository;

@Repository
public class DeliveryAttemptRepository {
  private final ConcurrentMap<String, CopyOnWriteArrayList<DeliveryAttemptRecord>>
      attemptsByMessageId = new ConcurrentHashMap<>();

  public DeliveryAttemptRecord record(
      String serverMsgId,
      String recipientId,
      String deviceId,
      String gatewayNode,
      DeliveryAttemptStatus status) {
    DeliveryAttemptRecord attempt =
        new DeliveryAttemptRecord(
            serverMsgId, recipientId, deviceId, gatewayNode, status, Instant.now());
    attemptsByMessageId
        .computeIfAbsent(serverMsgId, ignored -> new CopyOnWriteArrayList<>())
        .add(attempt);
    return attempt;
  }

  public List<DeliveryAttemptRecord> findByMessageId(String serverMsgId) {
    return List.copyOf(attemptsByMessageId.getOrDefault(serverMsgId, new CopyOnWriteArrayList<>()));
  }
}
