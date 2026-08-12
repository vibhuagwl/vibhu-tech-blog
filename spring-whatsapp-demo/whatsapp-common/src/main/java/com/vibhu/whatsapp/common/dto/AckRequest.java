package com.vibhu.whatsapp.common.dto;

public record AckRequest(String userId, String deviceId, AckType type) {
}
