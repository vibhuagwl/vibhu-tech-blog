package com.vibhu.fai.approval;

import com.vibhu.fai.common.security.AuthContext;
import com.vibhu.fai.obs.AiMetrics;
import com.vibhu.fai.payment.PaymentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ApprovalService {

  private final ApprovalRepository repo;
  private final PaymentService payments;
    private final AiMetrics metrics;

    public ApprovalService(ApprovalRepository repo, PaymentService payments, AiMetrics metrics) {
    this.repo = repo;
    this.payments = payments;
        this.metrics = metrics;
  }

  public ApprovalRequest proposeReversal(String transactionId, String reason, AuthContext auth) {
    ApprovalRequest req = new ApprovalRequest();
    req.setTransactionId(transactionId);
    req.setReason(reason);
    req.setTenantId(auth.tenantId());
    req.setRequestedBy(auth.userId());
    req.setStatus(ApprovalStatus.PENDING);
    req.setCreatedAt(Instant.now());
      metrics.approval("PENDING");
    return repo.save(req);
  }

  @Transactional
  public ApprovalRequest approve(Long id, AuthContext approver) {
    ApprovalRequest req =
        repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Unknown approval " + id));
    if (req.getStatus() != ApprovalStatus.PENDING) {
      throw new IllegalStateException("Not pending");
    }
    AuthContext writeAuth =
        new AuthContext(approver.tenantId(), approver.userId(), "APPROVER");
    payments.reverse(req.getTransactionId(), writeAuth);
    req.setStatus(ApprovalStatus.EXECUTED);
    req.setDecidedAt(Instant.now());
      metrics.approval("EXECUTED");
    return repo.save(req);
  }
}
