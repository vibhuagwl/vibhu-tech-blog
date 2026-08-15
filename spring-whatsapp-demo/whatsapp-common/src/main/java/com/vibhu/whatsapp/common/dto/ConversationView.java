package com.vibhu.whatsapp.common.dto;

import java.util.Set;

public record ConversationView(String conversationId, Set<String> participantIds) {}
