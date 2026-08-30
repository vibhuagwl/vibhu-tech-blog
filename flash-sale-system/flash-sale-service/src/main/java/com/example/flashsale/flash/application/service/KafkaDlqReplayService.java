package com.example.flashsale.flash.application.service;

import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.common.event.JsonEvents;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * WHY: ops must replay poison messages without minting a new eventId (consumers key on eventId).
 * If removed, a human republish with a new UUID double-applies a successful reserve.
 */
@Service
@Profile("!test")
public class KafkaDlqReplayService {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public KafkaDlqReplayService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void replay(String dlqTopic, String payload) {
        if (dlqTopic == null || !dlqTopic.endsWith(".dlq")) {
            throw new IllegalArgumentException("Replay only accepts *.dlq topics");
        }
        EventEnvelope env = JsonEvents.read(payload);
        String original = dlqTopic.substring(0, dlqTopic.length() - ".dlq".length());
        kafkaTemplate.send(original, env.partitionKey(), payload);
    }
}
