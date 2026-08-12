package com.vibhu.whatsapp.messageservice.messaging;

import com.vibhu.whatsapp.common.events.MessageCreatedEvent;

public interface MessageEventPublisher {
    void publish(MessageCreatedEvent event);
}
