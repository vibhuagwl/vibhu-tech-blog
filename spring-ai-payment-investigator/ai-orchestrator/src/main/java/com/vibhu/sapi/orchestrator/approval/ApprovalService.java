package com.vibhu.sapi.orchestrator.approval;

import com.vibhu.sapi.dto.ApprovalDecision;
import com.vibhu.sapi.dto.ApprovalRequest;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class ApprovalService {

  private final Map<String, ApprovalRequest> pending = new ConcurrentHashMap<>();

  public ApprovalRequest submit(String action, String paymentId, String requestedBy, String payload) {
    ApprovalRequest request =
        new ApprovalRequest(
            UUID.randomUUID().toString(),
            action,
            paymentId,
            requestedBy,
            "PENDING",
            Instant.now(),
            payload);
    pending.put(request.id(), request);
    return request;
  }

  public List<ApprovalRequest> listPending() {
    return pending.values().stream().filter(r -> "PENDING".equals(r.status())).toList();
  }

  public ApprovalRequest decide(String id, ApprovalDecision decision) {
    ApprovalRequest existing = pending.get(id);
    if (existing == null) {
      throw new IllegalArgumentException("Approval not found: " + id);
    }
    String status = "APPROVED".equalsIgnoreCase(decision.decision()) ? "APPROVED" : "REJECTED";
    ApprovalRequest updated =
        new ApprovalRequest(
            existing.id(),
            existing.action(),
            existing.paymentId(),
            existing.requestedBy(),
            status,
            existing.createdAt(),
            existing.payload() + " comment=" + decision.comment());
    pending.put(id, updated);
    return updated;
  }
}
