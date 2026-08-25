package com.vibhu.aifp.domain;

import com.vibhu.aifp.common.PaymentRecord;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

  private final DomainDataSeeder seeder;

  public PaymentService(DomainDataSeeder seeder) {
    this.seeder = seeder;
  }

  public PaymentRecord getPayment(String paymentId) {
    PaymentRecord payment = seeder.payments().get(normalize(paymentId));
    if (payment == null) {
      throw new IllegalArgumentException("Payment not found: " + paymentId);
    }
    return payment;
  }

  public List<PaymentRecord> searchPayments(String customerId, String status) {
    return seeder.payments().values().stream()
        .filter(p -> customerId == null || customerId.isBlank() || p.customerId().equalsIgnoreCase(customerId))
        .filter(p -> status == null || status.isBlank() || p.status().equalsIgnoreCase(status))
        .collect(Collectors.toList());
  }

  public String getPaymentStatus(String paymentId) {
    return getPayment(paymentId).status();
  }

  public Map<String, String> getPaymentFailureReason(String paymentId) {
    PaymentRecord payment = getPayment(paymentId);
    return Map.of(
        "paymentId", payment.paymentId(),
        "status", payment.status(),
        "failureCode", payment.failureCode() == null ? "" : payment.failureCode(),
        "bank", payment.bank(),
        "retryAllowed", String.valueOf(payment.retryAllowed()),
        "explanation",
            "BANK_TIMEOUT".equals(payment.failureCode())
                ? "HSBC gateway did not respond within SLA; safe to retry per policy."
                : "No failure recorded.");
  }

  public PaymentRecord refundPayment(String paymentId, String reason, boolean approved) {
    if (!approved) {
      throw new IllegalStateException("Refund requires approval");
    }
    PaymentRecord existing = getPayment(paymentId);
    PaymentRecord refunded =
        new PaymentRecord(
            existing.paymentId(),
            existing.customerId(),
            existing.amount(),
            existing.currency(),
            "REFUNDED",
            existing.bank(),
            existing.failureCode(),
            false,
            existing.createdAt());
    seeder.payments().put(existing.paymentId(), refunded);
    return refunded;
  }

  private static String normalize(String paymentId) {
    return paymentId == null ? "" : paymentId.trim().toUpperCase(Locale.ROOT);
  }
}
