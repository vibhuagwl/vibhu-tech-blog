package com.vibhu.whatsapp.messageservice.model;

import com.vibhu.whatsapp.common.dto.MessageView;
import com.vibhu.whatsapp.common.events.MessageCreatedEvent;

import java.time.Instant;

public record MessageRecord(
        String serverMsgId,
        String conversationId,
        long serverSeq,
        String senderId,
        String recipientId,
        String clientMsgId,
        String encryptedPayload,
        Instant createdAt
) {
    public MessageView toView() {
        return new MessageView(
                serverMsgId,
                conversationId,
                serverSeq,
                senderId,
                recipientId,
                clientMsgId,
                encryptedPayload,
                createdAt
        );
    }

    public MessageCreatedEvent toEvent() {
        return new MessageCreatedEvent(
                serverMsgId,
                conversationId,
                serverSeq,
                senderId,
                recipientId,
                clientMsgId,
                encryptedPayload,
                createdAt
        );
    }
}
