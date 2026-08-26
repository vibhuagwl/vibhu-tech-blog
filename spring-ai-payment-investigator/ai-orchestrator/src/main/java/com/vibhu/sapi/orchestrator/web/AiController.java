package com.vibhu.sapi.orchestrator.web;

import com.vibhu.sapi.dto.ApprovalDecision;
import com.vibhu.sapi.dto.ApprovalRequest;
import com.vibhu.sapi.dto.ChatRequest;
import com.vibhu.sapi.dto.ChatResponse;
import com.vibhu.sapi.orchestrator.approval.ApprovalService;
import com.vibhu.sapi.orchestrator.harness.AiExecutionHarness;
import com.vibhu.sapi.orchestrator.security.RequestUserContext;
import com.vibhu.sapi.security.UserContext;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

  private final AiExecutionHarness harness;
  private final ApprovalService approvalService;

  public AiController(AiExecutionHarness harness, ApprovalService approvalService) {
    this.harness = harness;
    this.approvalService = approvalService;
  }

  @PostMapping("/chat")
  public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
    UserContext user = RequestUserContext.get();
    return harness.execute(request, user);
  }

  @GetMapping("/approvals")
  public List<ApprovalRequest> approvals() {
    return approvalService.listPending();
  }

  @PostMapping("/approvals/{id}/decide")
  public ApprovalRequest decide(
      @PathVariable String id, @Valid @RequestBody ApprovalDecision decision) {
    return approvalService.decide(id, decision);
  }
}
