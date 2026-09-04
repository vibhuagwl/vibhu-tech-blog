package com.vibhu.fai.config;

import com.vibhu.fai.advisor.*;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.ToolCallAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class ChatClientConfig {

  @Bean
  ChatMemory chatMemory() {
    return MessageWindowChatMemory.builder().maxMessages(20).build();
  }

  @Bean
  ChatClient financialChatClient(
      ChatModel chatModel,
      ChatMemory chatMemory,
      SecurityAdvisor securityAdvisor,
      PiiRedactionAdvisor piiRedactionAdvisor,
          RagAdvisor ragAdvisor,
      AuditAdvisor auditAdvisor,
          CostControlAdvisor costControlAdvisor,
          ObjectProvider<ToolCallbackProvider> mcpTools) {
      ChatClient.Builder builder =
              ChatClient.builder(chatModel)
                      .defaultSystem(
                              """
                                      You are a financial investigation assistant for authenticated users.
                                      Rules:
                                      1. Never invent financial facts.
                                      2. Use tools for transaction/payment/portfolio facts.
                                      3. Java services are the source of truth.
                                      4. Never execute financial writes without approval tools.
                                      5. Use RAG/compliance tools for policies — cite policy ids.
                                      6. Return JSON matching the requested schema.
                                      """)
                      .defaultAdvisors(
                              securityAdvisor,
                              piiRedactionAdvisor,
                              ragAdvisor,
                              MessageChatMemoryAdvisor.builder(chatMemory)
                                      .build(),
                              ToolCallAdvisor.builder()
                                      .advisorOrder(Ordered.HIGHEST_PRECEDENCE + 300)
                                      .build(),
                              auditAdvisor,
                              costControlAdvisor);
      mcpTools.ifAvailable(builder::defaultToolCallbacks);
      return builder.build();
  }
}
