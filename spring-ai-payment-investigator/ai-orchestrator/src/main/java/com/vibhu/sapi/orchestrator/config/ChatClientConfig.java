package com.vibhu.sapi.orchestrator.config;

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
  ChatClient investigationChatClient(ChatModel chatModel, ChatMemory chatMemory) {
    return ChatClient.builder(chatModel)
        .defaultSystem(
            """
            You are a payment investigation assistant.
            Use tools for payment facts, bank responses, retry history, and policy.
            Never invent failure codes — assemble investigation from tool results.
            payment.execute and payment.retry require human approval — never call them.
            """)
        .defaultAdvisors(
            MessageChatMemoryAdvisor.builder(chatMemory).build(),
            ToolCallAdvisor.builder().advisorOrder(Ordered.HIGHEST_PRECEDENCE + 200).build())
        .build();
  }
}
