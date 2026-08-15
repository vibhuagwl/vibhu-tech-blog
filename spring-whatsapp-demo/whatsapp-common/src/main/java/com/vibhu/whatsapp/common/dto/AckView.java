package com.vibhu.whatsapp.common.dto;

import java.time.Instant;

public record AckView(
    String serverMsgId, String userId, String deviceId, AckType type, Instant ackedAt) {}
