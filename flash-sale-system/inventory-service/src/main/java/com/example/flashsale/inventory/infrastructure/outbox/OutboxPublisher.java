package com.example.flashsale.inventory.infrastructure.outbox;

import com.example.flashsale.common.error.PermanentException;
import com.example.flashsale.common.event.EventPayloads;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
@Profile("!test")
public class OutboxPublisher {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

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
            publishOne(event);
        }
    }

    private void publishOne(OutboxEvent event) {
        try {
            String topic = EventPayloads.requireTopic(event.getPayload());
            kafkaTemplate.send(topic, event.getPartitionKey(), event.getPayload())
                    .get(5, TimeUnit.SECONDS);
            event.markPublished();
        } catch (PermanentException | IllegalArgumentException poison) {
            log.error("poison outbox eventId={}", event.getEventId(), poison);
            event.markFailed();
        } catch (InterruptedException interrupted) {
            Thread.currentThread()
                    .interrupt();
            throw new IllegalStateException("outbox send interrupted", interrupted);
        } catch (Exception sendFailed) {
            log.warn("outbox send failed eventId={}", event.getEventId(), sendFailed);
            throw new IllegalStateException("outbox kafka send failed", sendFailed);
        }
    }
}
