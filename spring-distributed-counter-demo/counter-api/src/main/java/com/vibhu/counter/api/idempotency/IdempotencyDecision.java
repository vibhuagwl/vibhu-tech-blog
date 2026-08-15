package com.vibhu.counter.api.idempotency;

import java.util.Optional;

public record IdempotencyDecision(boolean firstWrite, Optional<String> key) {}
