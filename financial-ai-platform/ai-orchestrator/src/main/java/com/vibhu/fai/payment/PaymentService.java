package com.vibhu.fai.payment;

import com.vibhu.fai.common.dto.PaymentView;
import com.vibhu.fai.common.security.AuthContext;
import java.util.List;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ============================================================
 * INTERVIEW NOTES — Cache L1/L2 + Source of Truth
 * ============================================================
 * L1 Caffeine (JVM) → miss → DB (default profile).
 * With Redis profile: shared L2 between pods.
 * Cache failure should degrade latency, not correctness.
 * DB = source of truth for payment state.
 * ============================================================
 */
@Service
public class PaymentService {

  private final PaymentRepository repo;
  private final PaymentAuthz authz;

  public PaymentService(PaymentRepository repo, PaymentAuthz authz) {
    this.repo = repo;
    this.authz = authz;
  }

  @Cacheable(cacheNames = "payments", key = "#transactionId", sync = true)
  public PaymentView getPayment(String transactionId, AuthContext auth) {
    Payment p =
        repo.findById(transactionId)
            .orElseThrow(() -> new PaymentNotFoundException(transactionId));
    authz.requirePaymentRead(auth, p);
    return toView(p);
  }

  public List<PaymentView> history(String accountId, AuthContext auth) {
    return repo.findByAccountIdOrderByCreatedAtDesc(accountId).stream()
        .filter(p -> auth.tenantId().equals(p.getTenantId()))
        .map(PaymentService::toView)
        .toList();
  }

  @Transactional
  @CacheEvict(cacheNames = "payments", key = "#transactionId")
  public PaymentView reverse(String transactionId, AuthContext auth) {
    // SECURITY RULE: called only AFTER human approval — never from LLM tool directly.
    Payment p =
        repo.findById(transactionId)
            .orElseThrow(() -> new PaymentNotFoundException(transactionId));
    authz.requirePaymentWrite(auth, p);
    if (p.getStatus() != PaymentStatus.FAILED && p.getStatus() != PaymentStatus.SUCCESS) {
      throw new IllegalStateException("Cannot reverse status=" + p.getStatus());
    }
    p.setStatus(PaymentStatus.REVERSED);
    p.setFailureReason("REVERSED_AFTER_APPROVAL");
    return toView(p);
  }

  static PaymentView toView(Payment p) {
    return new PaymentView(
        p.getTransactionId(),
        p.getAmount(),
        p.getCurrency(),
        p.getStatus().name(),
        p.getBankResponseCode(),
        p.getFailureReason(),
        p.getAccountId(),
        p.getCreatedAt());
  }
}
