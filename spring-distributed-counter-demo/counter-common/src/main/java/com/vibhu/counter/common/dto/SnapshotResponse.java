package com.vibhu.counter.common.dto;

public record SnapshotResponse(String resourceId, long value, String consistency) {}
