package com.example.flashsale.inventory.infrastructure.outbox;

import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.common.event.JsonEvents;
import org.springframework.beans.factory.annotation.Value;
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
    private final int batchSize;

    public OutboxPublisher(
            OutboxEventRepository repository,
            KafkaTemplate<String, String> kafkaTemplate,
            @Value("${app.outbox.batch-size:500}") int batchSize) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
        this.batchSize = batchSize;
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:200}")
    @Transactional
    public void publishBatch() {
        List<OutboxEvent> batch = repository.lockNextBatch(batchSize);
        for (OutboxEvent event : batch) {
            EventEnvelope env = JsonEvents.read(event.getPayload());
            String topic = String.valueOf(env.payload()
                    .getOrDefault("topic", env.eventType()));
            kafkaTemplate.send(topic, event.getPartitionKey(), event.getPayload());
            event.markPublished();
        }
    }
}
