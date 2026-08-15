package com.vibhu.msp.eventsourcing;

import java.time.Instant;

public record DomainEvent(
    String aggregateId, String eventType, String payload, Instant occurredAt, long version) {}
