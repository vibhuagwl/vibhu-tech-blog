package com.vibhu.whatsapp.messageservice.model;

import com.vibhu.whatsapp.common.dto.DeliveryAttemptStatus;
import com.vibhu.whatsapp.common.dto.DeliveryAttemptView;
import java.time.Instant;

public record DeliveryAttemptRecord(
    String serverMsgId,
    String recipientId,
    String deviceId,
    String gatewayNode,
    DeliveryAttemptStatus status,
    Instant attemptedAt) {
  public DeliveryAttemptView toView() {
    return new DeliveryAttemptView(
        serverMsgId, recipientId, deviceId, gatewayNode, status, attemptedAt);
  }
}
