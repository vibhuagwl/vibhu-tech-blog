package com.vibhu.sapi;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vibhu.sapi.dto.Evidence;
import com.vibhu.sapi.dto.PaymentInvestigation;
import com.vibhu.sapi.exception.StructuredOutputValidationException;
import com.vibhu.sapi.orchestrator.PaymentInvestigatorApplication;
import com.vibhu.sapi.orchestrator.validation.StructuredOutputValidator;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = PaymentInvestigatorApplication.class)
class StructuredOutputValidationTest {

  @Autowired StructuredOutputValidator validator;

  @Test
  void rejectsEmptyEvidence() {
    PaymentInvestigation bad =
        new PaymentInvestigation(
            "TXN-1001",
            "FAILED",
            "cause",
            List.of(),
            List.of("action"),
            "HIGH",
            false);
    assertThatThrownBy(() -> validator.validate(bad))
        .isInstanceOf(StructuredOutputValidationException.class);
  }

  @Test
  void acceptsValidInvestigation() {
    PaymentInvestigation ok =
        new PaymentInvestigation(
            "TXN-1001",
            "FAILED",
            "BEN-001 beneficiary invalid",
            List.of(new Evidence("bank", "TXN-1001", "BEN-001", "HIGH")),
            List.of("Verify beneficiary"),
            "HIGH",
            true);
    validator.validate(ok);
  }
}
