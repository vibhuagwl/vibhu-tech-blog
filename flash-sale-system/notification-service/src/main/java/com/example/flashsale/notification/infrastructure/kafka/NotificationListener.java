package com.example.flashsale.notification.infrastructure.kafka;

import com.example.flashsale.common.event.JsonEvents;
import com.example.flashsale.common.kafka.Topics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationListener {
    private static final Logger log = LoggerFactory.getLogger(NotificationListener.class);

    @KafkaListener(topics = Topics.NOTIFICATION_REQUESTED, groupId = "notification-service")
    public void on(String json) {
        log.info("notify {}",
                JsonEvents.read(json)
                        .payload());
    }
}
