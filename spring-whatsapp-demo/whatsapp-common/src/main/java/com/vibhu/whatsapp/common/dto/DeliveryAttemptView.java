package com.vibhu.whatsapp.common.dto;

import java.time.Instant;

public record DeliveryAttemptView(
    String serverMsgId,
    String recipientId,
    String deviceId,
    String gatewayNode,
    DeliveryAttemptStatus status,
    Instant attemptedAt) {}
