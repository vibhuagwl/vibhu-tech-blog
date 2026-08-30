package com.example.flashsale.order.infrastructure.outbox;

import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.common.event.JsonEvents;
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

    @Scheduled(fixedDelayString = "200")
    @Transactional
    public void publish() {
        List<OutboxEvent> batch = repository.lockNextBatch(500);
        for (OutboxEvent e : batch) {
            EventEnvelope env = JsonEvents.read(e.getPayload());
            String topic = String.valueOf(env.payload()
                    .get("topic"));
            kafkaTemplate.send(topic, e.getPartitionKey(), e.getPayload());
            e.markPublished();
        }
    }
}
