package com.vibhu.whatsapp.common.events;

import java.time.Instant;

public record MessageCreatedEvent(
    String serverMsgId,
    String conversationId,
    long serverSeq,
    String senderId,
    String recipientId,
    String clientMsgId,
    String encryptedPayload,
    Instant createdAt) {}
