package com.vibhu.whatsapp.common.dto;

public record SendMessageRequest(String clientMsgId, String recipientId, String encryptedPayload) {}
