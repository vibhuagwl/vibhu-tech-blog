package com.vibhu.msp.eventsourcing;

import java.time.Instant;
import java.util.List;

public record DomainEvent(String aggregateId, String eventType, String payload, Instant occurredAt, long version) {}
