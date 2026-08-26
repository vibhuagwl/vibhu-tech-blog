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
        return MessageWindowChatMemory.builder()
                .maxMessages(24)
                .build();
    }

    @Bean
    ChatClient investigationChatClient(ChatModel chatModel, ChatMemory chatMemory,
            InvestigationSkillService skillService) {
        return ChatClient.builder(chatModel)
                .defaultSystem(skillService.systemPrompt())
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory)
                                .build(),
                        ToolCallAdvisor.builder()
                                .advisorOrder(Ordered.HIGHEST_PRECEDENCE + 200)
                                .build())
                .build();
    }
}
