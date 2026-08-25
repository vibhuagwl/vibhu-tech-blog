package com.vibhu.fai.web;

import com.vibhu.fai.common.dto.ChatApiResponse;
import com.vibhu.fai.common.dto.ChatRequest;
import com.vibhu.fai.common.security.AuthContext;
import com.vibhu.fai.orchestrator.FinancialAiOrchestrator;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

  private final FinancialAiOrchestrator orchestrator;

  public AiController(FinancialAiOrchestrator orchestrator) {
    this.orchestrator = orchestrator;
  }

  @PostMapping("/chat")
  public ChatApiResponse chat(
      @Valid @RequestBody ChatRequest request,
      @RequestHeader(value = "X-Tenant-Id", defaultValue = "TENANT-1") String tenantId,
      @RequestHeader(value = "X-User-Id", defaultValue = "user-demo") String userId,
      @RequestHeader(value = "X-Role", defaultValue = "ANALYST") String role) {
    AuthContext auth = new AuthContext(tenantId, userId, role);
    return orchestrator.chat(request, auth);
  }
}
