package com.vibhu.aifp.harness;

import com.vibhu.aifp.common.PaymentInvestigation;
import org.springframework.stereotype.Component;

@Component
public class OutputGuardrail {

  public void validateInvestigation(PaymentInvestigation investigation) {
    if (investigation == null) {
      throw new IllegalArgumentException("Investigation response required");
    }
    if (investigation.evidence() == null || investigation.evidence().isEmpty()) {
      throw new IllegalStateException("Investigation must cite evidence from tools or RAG");
    }
    if (investigation.rootCause() == null || investigation.rootCause().isBlank()) {
      throw new IllegalStateException("Investigation must include root cause");
    }
  }

  public String validateAnswer(String answer) {
    if (answer == null || answer.isBlank()) {
      throw new IllegalStateException("Model returned empty answer");
    }
    return answer;
  }
}
