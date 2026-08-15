package com.vibhu.whatsapp.deliveryworker.delivery;

import com.vibhu.whatsapp.common.dto.DeliveryAttemptStatus;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Repository;

@Repository
public class WorkerDeliveryAttemptRepository {
  private final ConcurrentMap<String, CopyOnWriteArrayList<WorkerDeliveryAttempt>>
      attemptsByMessageId = new ConcurrentHashMap<>();

  public WorkerDeliveryAttempt record(
      String serverMsgId,
      String recipientId,
      String deviceId,
      String gatewayNode,
      DeliveryAttemptStatus status) {
    WorkerDeliveryAttempt attempt =
        new WorkerDeliveryAttempt(
            serverMsgId, recipientId, deviceId, gatewayNode, status, Instant.now());
    attemptsByMessageId
        .computeIfAbsent(serverMsgId, ignored -> new CopyOnWriteArrayList<>())
        .add(attempt);
    return attempt;
  }

  public List<WorkerDeliveryAttempt> findByMessageId(String serverMsgId) {
    return List.copyOf(attemptsByMessageId.getOrDefault(serverMsgId, new CopyOnWriteArrayList<>()));
  }
}
