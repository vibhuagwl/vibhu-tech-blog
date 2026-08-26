package com.vibhu.sapi.orchestrator.validation;

import com.vibhu.sapi.dto.Evidence;
import com.vibhu.sapi.dto.PaymentInvestigation;
import com.vibhu.sapi.exception.StructuredOutputValidationException;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class StructuredOutputValidator {

  public void validate(PaymentInvestigation investigation) {
    if (investigation == null) {
      throw new StructuredOutputValidationException("Investigation output is null");
    }
    if (investigation.paymentId() == null || investigation.paymentId().isBlank()) {
      throw new StructuredOutputValidationException("paymentId is required");
    }
    if (investigation.status() == null || investigation.status().isBlank()) {
      throw new StructuredOutputValidationException("status is required");
    }
    if (investigation.rootCause() == null || investigation.rootCause().isBlank()) {
      throw new StructuredOutputValidationException("rootCause is required");
    }
    List<Evidence> evidence = investigation.evidence();
    if (evidence == null || evidence.isEmpty()) {
      throw new StructuredOutputValidationException("evidence must not be empty");
    }
    List<String> actions = investigation.recommendedActions();
    if (actions == null || actions.isEmpty()) {
      throw new StructuredOutputValidationException("recommendedActions must not be empty");
    }
  }
}
