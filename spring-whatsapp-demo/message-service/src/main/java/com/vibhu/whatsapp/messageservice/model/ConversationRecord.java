package com.vibhu.whatsapp.messageservice.model;

import com.vibhu.whatsapp.common.dto.ConversationView;

import java.util.Set;

public record ConversationRecord(String conversationId, Set<String> participantIds) {
    public ConversationRecord {
        participantIds = Set.copyOf(participantIds);
    }

    public boolean includes(String userId) {
        return participantIds.contains(userId);
    }

    public ConversationView toView() {
        return new ConversationView(conversationId, participantIds);
    }
}
