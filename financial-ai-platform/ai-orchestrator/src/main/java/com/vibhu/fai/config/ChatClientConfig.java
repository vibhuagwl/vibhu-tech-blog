package com.vibhu.fai.config;

import com.vibhu.fai.advisor.AuditAdvisor;
import com.vibhu.fai.advisor.CostControlAdvisor;
import com.vibhu.fai.advisor.PiiRedactionAdvisor;
import com.vibhu.fai.advisor.SecurityAdvisor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.ToolCallAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

/**
 * ============================================================
 * INTERVIEW NOTES — ChatClient
 * ============================================================
 * ChatClient = application-facing Spring AI fluent API.
 * Connects: app logic → ChatModel → LLM/provider.
 * Advisors ≈ filters/interceptors around the model call.
 * Ordering matters: Security → PII → Memory → Audit → Model
 * ============================================================
 */
@Configuration
public class ChatClientConfig {

  @Bean
  ChatMemory chatMemory() {
    // Default in-memory window. Redis-backed repo can replace this in redis profile.
    return MessageWindowChatMemory.builder().maxMessages(20).build();
  }

  @Bean
  ChatClient financialChatClient(
      ChatModel chatModel,
      ChatMemory chatMemory,
      SecurityAdvisor securityAdvisor,
      PiiRedactionAdvisor piiRedactionAdvisor,
      AuditAdvisor auditAdvisor,
      CostControlAdvisor costControlAdvisor) {
    return ChatClient.builder(chatModel)
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
            MessageChatMemoryAdvisor.builder(chatMemory).build(),
            // INTERVIEW: ToolCallAdvisor runs the tool loop (model↔tools↔model).
            ToolCallAdvisor.builder().advisorOrder(Ordered.HIGHEST_PRECEDENCE + 300).build(),
            auditAdvisor,
            costControlAdvisor)
        .build();
  }
}
