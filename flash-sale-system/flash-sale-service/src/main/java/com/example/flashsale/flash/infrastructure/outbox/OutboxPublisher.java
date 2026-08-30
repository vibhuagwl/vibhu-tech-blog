package com.example.flashsale.flash.infrastructure.outbox;

import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.common.event.JsonEvents;
import com.example.flashsale.common.kafka.Topics;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Profile("!test")
public class OutboxPublisher {
    private final OutboxEventRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public OutboxPublisher(OutboxEventRepository repository, KafkaTemplate<String, String> kafkaTemplate) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:200}")
    @Transactional
    public void publishBatch() {
        List<OutboxEvent> batch = repository.lockNextBatch(500);
        for (OutboxEvent event : batch) {
            EventEnvelope env = JsonEvents.read(event.getPayload());
            String topic = String.valueOf(env.payload()
                    .getOrDefault("topic", Topics.ORDER_REQUESTED));
            kafkaTemplate.send(topic, event.getPartitionKey(), event.getPayload());
            event.markPublished();
        }
    }
}
