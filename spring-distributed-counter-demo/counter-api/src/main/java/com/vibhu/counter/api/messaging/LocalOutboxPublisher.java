package com.vibhu.counter.api.messaging;

import com.vibhu.counter.common.events.CounterDeltaEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!kafka")
public class LocalOutboxPublisher implements OutboxPublisher {
    private final ApplicationEventPublisher eventPublisher;
    private final InMemoryOutbox outbox;

    public LocalOutboxPublisher(ApplicationEventPublisher eventPublisher, InMemoryOutbox outbox) {
        this.eventPublisher = eventPublisher;
        this.outbox = outbox;
    }

    @Override
    public void publishAfterPersist(CounterDeltaEvent event) {
        outbox.add(event);
        publishQueued(event);
    }

    @Override
    public int flush(String resourceId) {
        int attempted = 0;
        for (CounterDeltaEvent event : outbox.pendingFor(resourceId)) {
            publishQueued(event);
            attempted++;
        }
        return attempted;
    }

    @Override
    public int pendingCount(String resourceId) {
        return outbox.pendingCount(resourceId);
    }

    private void publishQueued(CounterDeltaEvent event) {
        eventPublisher.publishEvent(event);
        outbox.remove(event);
    }
}
