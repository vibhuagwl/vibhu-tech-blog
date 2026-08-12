package com.vibhu.counter.common.dto;

import java.util.List;

public record BatchCounterRequest(List<String> resourceIds) {
}
