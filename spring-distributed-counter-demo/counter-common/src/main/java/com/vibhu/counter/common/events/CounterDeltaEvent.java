package com.vibhu.counter.common.events;

import com.vibhu.counter.common.dto.CounterAction;

import java.time.Instant;

public record CounterDeltaEvent(
        String eventId,
        String resourceId,
        int shard,
        long delta,
        CounterAction action,
        String userId,
        String clientRequestId,
        Instant occurredAt
) {
}
