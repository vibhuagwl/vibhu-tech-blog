package com.vibhu.whatsapp.common.dto;

public record PresenceHeartbeatRequest(String userId, String deviceId, String gatewayNode) {
}
