package com.vibhu.whatsapp.messageservice.model;

import com.vibhu.whatsapp.common.dto.AckType;
import com.vibhu.whatsapp.common.dto.AckView;

import java.time.Instant;

public record AckRecord(String serverMsgId, String userId, String deviceId, AckType type, Instant ackedAt) {
    public AckView toView() {
        return new AckView(serverMsgId, userId, deviceId, type, ackedAt);
    }
}
