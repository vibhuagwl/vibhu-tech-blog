package com.vibhu.counter.common.dto;

import java.util.Map;

public record CounterValueResponse(
        String resourceId,
        long value,
        Map<Integer, Long> shards,
        String consistency
) {
}
