package com.vibhu.counter.common.dto;

import java.util.List;

public record BatchCounterResponse(List<CounterValueResponse> counters) {}
