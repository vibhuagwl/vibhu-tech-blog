package com.vibhu.aifp.assistant.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.ToolCallAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class ChatClientConfig {

  @Bean
  ChatMemory chatMemory() {
    return MessageWindowChatMemory.builder().maxMessages(24).build();
  }

  @Bean
  ChatClient opsChatClient(ChatModel chatModel, ChatMemory chatMemory) {
    return ChatClient.builder(chatModel)
        .defaultSystem(
            """
            You are a FinTech AI Ops assistant.
            Use tools for payment, customer, Kafka, and reporting facts.
            Never invent BANK_TIMEOUT or HSBC outcomes — call tools.
            Write operations require human approval.
            """)
        .defaultAdvisors(
            MessageChatMemoryAdvisor.builder(chatMemory).build(),
            ToolCallAdvisor.builder().advisorOrder(Ordered.HIGHEST_PRECEDENCE + 200).build())
        .build();
  }
}
