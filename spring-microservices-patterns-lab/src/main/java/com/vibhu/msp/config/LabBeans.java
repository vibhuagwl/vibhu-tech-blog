package com.vibhu.msp.config;

import com.vibhu.msp.eip.InMemoryMessageStore;
import com.vibhu.msp.eventsourcing.InMemoryEventStore;
import com.vibhu.msp.id.SnowflakeIdGenerator;
import com.vibhu.msp.lock.InMemoryLockStore;
import com.vibhu.msp.outbox.InMemoryEventBus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LabBeans {

    @Bean
    SnowflakeIdGenerator snowflakeIdGenerator(
            @Value("${msp.snowflake.worker-id:1}") long workerId,
            @Value("${msp.snowflake.datacenter-id:1}") long datacenterId) {
        return new SnowflakeIdGenerator(workerId, datacenterId);
    }

    @Bean
    InMemoryEventBus inMemoryEventBus() {
        return new InMemoryEventBus();
    }

    @Bean
    InMemoryEventStore inMemoryEventStore() {
        return new InMemoryEventStore();
    }

    @Bean
    InMemoryLockStore inMemoryLockStore() {
        return new InMemoryLockStore();
    }

    @Bean
    InMemoryMessageStore inMemoryMessageStore() {
        return new InMemoryMessageStore();
    }
}
