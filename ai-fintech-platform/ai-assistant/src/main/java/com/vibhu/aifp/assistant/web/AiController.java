package com.vibhu.aifp.assistant.web;

import com.vibhu.aifp.assistant.security.UserContextHolder;
import com.vibhu.aifp.assistant.service.AiChatService;
import com.vibhu.aifp.common.AiChatRequest;
import com.vibhu.aifp.common.AiChatResponse;
import com.vibhu.aifp.common.UserContext;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

  private final AiChatService aiChatService;

  public AiController(AiChatService aiChatService) {
    this.aiChatService = aiChatService;
  }

  @PostMapping("/chat")
  public AiChatResponse chat(@Valid @RequestBody AiChatRequest request) {
    UserContext user = UserContextHolder.get();
    return aiChatService.chat(request, user);
  }
}
