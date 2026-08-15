package com.vibhu.counter.common.dto;

public record IncrementCounterRequest(Long delta, String clientRequestId, CounterAction action) {}
