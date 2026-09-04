package com.example.kafka;

import com.example.kafka.config.KafkaAppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(KafkaAppProperties.class)
public class SecureKafkaApplication {
    public static void main(String[] args) {
        SpringApplication.run(SecureKafkaApplication.class, args);
    }
}
