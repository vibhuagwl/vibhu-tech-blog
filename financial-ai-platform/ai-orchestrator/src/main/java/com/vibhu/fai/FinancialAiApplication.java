package com.vibhu.fai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(
    exclude = {RedisAutoConfiguration.class, KafkaAutoConfiguration.class},
    excludeName = {
      "org.springframework.ai.model.openai.autoconfigure.OpenAiChatAutoConfiguration",
      "org.springframework.ai.model.openai.autoconfigure.OpenAiEmbeddingAutoConfiguration",
      "org.springframework.ai.model.openai.autoconfigure.OpenAiImageAutoConfiguration",
      "org.springframework.ai.model.openai.autoconfigure.OpenAiAudioSpeechAutoConfiguration",
      "org.springframework.ai.model.openai.autoconfigure.OpenAiAudioTranscriptionAutoConfiguration",
      "org.springframework.ai.model.openai.autoconfigure.OpenAiModerationAutoConfiguration"
    })
@EnableCaching
@EnableScheduling
public class FinancialAiApplication {
  public static void main(String[] args) {
    SpringApplication.run(FinancialAiApplication.class, args);
  }
}
