package com.vibhu.counter.api.messaging;

import com.vibhu.counter.common.events.CounterDeltaEvent;
import com.vibhu.counter.common.events.CounterTopics;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Profile("kafka")
public class KafkaOutboxPublisher implements OutboxPublisher {
    private final KafkaTemplate<String, CounterDeltaEvent> kafkaTemplate;
    private final InMemoryOutbox outbox;

    public KafkaOutboxPublisher(KafkaTemplate<String, CounterDeltaEvent> kafkaTemplate, InMemoryOutbox outbox) {
        this.kafkaTemplate = kafkaTemplate;
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
        kafkaTemplate.send(CounterTopics.COUNTER_DELTAS, event.resourceId(), event)
                .whenComplete((result, failure) -> {
                    if (failure == null) {
                        outbox.remove(event);
                    }
                });
    }
}
