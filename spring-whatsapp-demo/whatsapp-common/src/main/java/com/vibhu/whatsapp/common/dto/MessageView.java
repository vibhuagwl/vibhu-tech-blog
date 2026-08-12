package com.vibhu.whatsapp.common.dto;

import java.time.Instant;

public record MessageView(
        String serverMsgId,
        String conversationId,
        long serverSeq,
        String senderId,
        String recipientId,
        String clientMsgId,
        String encryptedPayload,
        Instant createdAt
) {
}
