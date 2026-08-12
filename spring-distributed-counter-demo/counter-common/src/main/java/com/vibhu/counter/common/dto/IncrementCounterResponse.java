package com.vibhu.counter.common.dto;

public record IncrementCounterResponse(
        String resourceId,
        long value,
        boolean applied,
        int shard,
        String shardKey,
        String idempotencyKey,
        String consistency
) {
}
