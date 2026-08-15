package com.vibhu.counter.common.dto;

public record FlushResponse(String resourceId, int flushedDeltas, int pendingDeltas) {}
