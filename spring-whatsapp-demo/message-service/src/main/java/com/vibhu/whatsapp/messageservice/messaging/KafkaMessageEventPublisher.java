package com.vibhu.whatsapp.messageservice.messaging;

import com.vibhu.whatsapp.common.events.MessageCreatedEvent;
import com.vibhu.whatsapp.common.events.WhatsAppTopics;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Profile("kafka")
public class KafkaMessageEventPublisher implements MessageEventPublisher {
    private final KafkaTemplate<String, MessageCreatedEvent> kafkaTemplate;

    public KafkaMessageEventPublisher(KafkaTemplate<String, MessageCreatedEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Override
    public void publish(MessageCreatedEvent event) {
        kafkaTemplate.send(WhatsAppTopics.MESSAGE_CREATED, event.conversationId(), event);
    }
}
