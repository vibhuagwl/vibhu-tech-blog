package com.vibhu.aifp.domain;

import com.vibhu.aifp.common.ApprovalRequest;
import com.vibhu.aifp.common.KafkaMessageRecord;
import com.vibhu.aifp.common.PaymentRecord;
import com.vibhu.aifp.common.UserContext;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class ApprovalService {

  private final Map<String, ApprovalRequest> approvals = new ConcurrentHashMap<>();
  private final PaymentService paymentService;
  private final KafkaOpsService kafkaOpsService;

  public ApprovalService(PaymentService paymentService, KafkaOpsService kafkaOpsService) {
    this.paymentService = paymentService;
    this.kafkaOpsService = kafkaOpsService;
  }

  public ApprovalRequest propose(String toolName, Map<String, Object> payload, UserContext proposer) {
    String id = "APR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    ApprovalRequest request =
        new ApprovalRequest(
            id,
            toolName,
            payload,
            "PENDING",
            proposer.userId(),
            null,
            Instant.now(),
            null);
    approvals.put(id, request);
    return request;
  }

  public ApprovalRequest approve(String approvalId, UserContext approver) {
    ApprovalRequest pending = approvals.get(approvalId);
    if (pending == null) {
      throw new IllegalArgumentException("Approval not found: " + approvalId);
    }
    if (!"PENDING".equals(pending.status())) {
      throw new IllegalStateException("Approval already resolved: " + pending.status());
    }
    executeApprovedTool(pending);
    ApprovalRequest executed =
        new ApprovalRequest(
            pending.id(),
            pending.toolName(),
            pending.payload(),
            "EXECUTED",
            pending.proposedBy(),
            approver.userId(),
            pending.createdAt(),
            Instant.now());
    approvals.put(approvalId, executed);
    return executed;
  }

  public ApprovalRequest get(String approvalId) {
    ApprovalRequest request = approvals.get(approvalId);
    if (request == null) {
      throw new IllegalArgumentException("Approval not found: " + approvalId);
    }
    return request;
  }

  private void executeApprovedTool(ApprovalRequest pending) {
    switch (pending.toolName()) {
      case "replayMessage" -> {
        String messageId = String.valueOf(pending.payload().get("messageId"));
        kafkaOpsService.replayMessage(messageId, true);
      }
      case "refundPayment" -> {
        String paymentId = String.valueOf(pending.payload().get("paymentId"));
        String reason = String.valueOf(pending.payload().getOrDefault("reason", "approved"));
        PaymentRecord refunded = paymentService.refundPayment(paymentId, reason, true);
        pending.payload().put("result", refunded.status());
      }
      default -> throw new IllegalStateException("Unsupported approval tool: " + pending.toolName());
    }
  }

  public KafkaMessageRecord proposeReplay(String messageId, UserContext proposer) {
    propose("replayMessage", Map.of("messageId", messageId), proposer);
    return kafkaOpsService.replayMessage(messageId, false);
  }
}
