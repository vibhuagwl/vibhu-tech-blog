package com.vibhu.counter.common.dto;

import java.util.List;

public record ShardBreakdownResponse(
    String resourceId, List<ShardValue> shards, long value, String keyPattern) {}
