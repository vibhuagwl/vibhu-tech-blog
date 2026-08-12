package com.vibhu.whatsapp.deliveryworker.delivery;

import com.vibhu.whatsapp.common.dto.DeliveryAttemptStatus;

import java.time.Instant;

public record WorkerDeliveryAttempt(
        String serverMsgId,
        String recipientId,
        String deviceId,
        String gatewayNode,
        DeliveryAttemptStatus status,
        Instant attemptedAt
) {
}
