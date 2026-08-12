package com.vibhu.whatsapp.messageservice.config;

import com.vibhu.whatsapp.common.events.WhatsAppTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@Profile("kafka")
public class KafkaTopicConfig {
    @Bean
    NewTopic messageCreatedTopic() {
        return TopicBuilder.name(WhatsAppTopics.MESSAGE_CREATED)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
