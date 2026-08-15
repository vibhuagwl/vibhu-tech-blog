package com.vibhu.msp.it;

import com.vibhu.msp.kafka.OrderCreatedListener;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Testcontainers
@EnabledIfEnvironmentVariable(named = "MSP_IT", matches = "true")
@TestPropertySource(properties = {
    "msp.kafka.enabled=true",
    "msp.kafka.order-topic=order-created-it",
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration",
    "spring.kafka.listener.auto-startup=true"
})
class KafkaConsumerIT {

  @Container
  static KafkaContainer kafka = new KafkaContainer(
      DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));

  @DynamicPropertySource
  static void kafkaProps(DynamicPropertyRegistry registry) {
    registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
  }

  @Autowired OrderCreatedListener listener;

  @BeforeEach
  void reset() {
    listener.reset();
  }

  @Test
  void consumerReceivesPublishedOrderEvent() throws InterruptedException {
    Map<String, Object> props = new HashMap<>();
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers());
    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    ProducerFactory<String, String> pf = new DefaultKafkaProducerFactory<>(props);
    KafkaTemplate<String, String> template = new KafkaTemplate<>(pf);

    template.send("order-created-it", "ORD-K1", "{\"id\":\"ORD-K1\"}");

    long deadline = System.currentTimeMillis() + 15_000;
    while (System.currentTimeMillis() < deadline) {
      if (listener.hasConsumed("ORD-K1")) {
        return;
      }
      TimeUnit.MILLISECONDS.sleep(200);
    }
    assertTrue(listener.hasConsumed("ORD-K1"), "Kafka consumer did not receive message in time");
  }
}
