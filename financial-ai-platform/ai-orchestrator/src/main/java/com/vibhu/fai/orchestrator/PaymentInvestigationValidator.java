package com.vibhu.fai.orchestrator;

import com.vibhu.fai.common.dto.PaymentInvestigation;
import org.springframework.stereotype.Component;

@Component
public class PaymentInvestigationValidator {

  public void validate(PaymentInvestigation inv) {
    // INTERVIEW: Never blindly trust structured output.
    if (inv == null || inv.transactionId() == null || inv.transactionId().isBlank()) {
      throw new IllegalArgumentException("Investigation missing transactionId");
    }
    if (inv.evidence() == null || inv.evidence().isEmpty()) {
      throw new IllegalArgumentException("Investigation must include evidenceIds");
    }
    if (inv.rootCause() == null || inv.rootCause().isBlank()) {
      throw new IllegalArgumentException("Investigation missing rootCause");
    }
  }
}
