package com.vibhu.fai.payment;

import com.vibhu.fai.common.dto.PaymentView;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * ============================================================
 * INTERVIEW NOTES
 * ============================================================
 * Deterministic root-cause mapping lives in Java — not in the prompt.
 * Bank codes (AC04, AM04, ...) are industry facts we encode here.
 * LLM may explain this result; it must not invent the code meaning.
 * ============================================================
 */
@Component
public class PaymentRootCauseAnalyzer {

  public record RootCause(String rootCause, String recommendedAction, List<String> evidence) {}

  public RootCause analyze(PaymentView payment, String policySnippet) {
    List<String> evidence = new ArrayList<>();
    evidence.add("PAYMENT-" + payment.transactionId());
    String root;
    String action;
    switch (payment.bankResponseCode() == null ? "" : payment.bankResponseCode()) {
      case "AC04" -> {
        root = "Payment rejected by bank: account closed (AC04)";
        action = "Ask customer to update beneficiary account; reversal may be proposed if funds held";
      }
      case "AM04" -> {
        root = "Payment rejected: insufficient funds (AM04)";
        action = "Retry after funding or reduce amount";
      }
      case "AG01" -> {
        root = "Payment blocked: transaction forbidden on account (AG01)";
        action = "Escalate to compliance review";
      }
      default -> {
        root =
            payment.failureReason() != null
                ? payment.failureReason()
                : "Unknown failure — inspect bank response and ops runbook";
        action = "Open ops case with bankResponseCode=" + payment.bankResponseCode();
      }
    }
    if (policySnippet != null && !policySnippet.isBlank()) {
      evidence.add(policySnippet);
    }
    return new RootCause(root, action, evidence);
  }
}
