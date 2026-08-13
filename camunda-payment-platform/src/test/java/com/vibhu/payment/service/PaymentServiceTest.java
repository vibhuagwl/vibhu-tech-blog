package com.vibhu.payment.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vibhu.payment.exception.BusinessPaymentException;
import com.vibhu.payment.model.PaymentRequest;
import com.vibhu.payment.model.PaymentStatus;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class PaymentServiceTest {

  @Autowired PaymentService payments;
  @Autowired FraudService fraud;
  @Autowired BankService bank;

  @Test
  void validateIsIdempotent() {
    String id = "PAY-UT-" + UUID.randomUUID().toString().substring(0, 6);
    payments.createStarted(new PaymentRequest(id, "CUST-1", new BigDecimal("10.00"), "INR"));
    Map<String, Object> first = payments.validate(id);
    Map<String, Object> second = payments.validate(id);
    assertThat(first.get("requiresApproval")).isEqualTo(false);
    assertThat(second.get("paymentId")).isEqualTo(id);
    assertThat(payments.require(id).getStatus()).isEqualTo(PaymentStatus.VALIDATED);
  }

  @Test
  void fraudRule() {
    String id = "PAY-UT-F-" + UUID.randomUUID().toString().substring(0, 5);
    payments.createStarted(new PaymentRequest(id, "X-FRAUD", new BigDecimal("1"), "USD"));
    assertThat(fraud.check(id).get("fraudDetected")).isEqualTo(true);
  }

  @Test
  void bankBusinessDecline() {
    String id = "PAY-UT-D-" + UUID.randomUUID().toString().substring(0, 5);
    payments.createStarted(new PaymentRequest(id, "X-DECLINE", new BigDecimal("1"), "USD"));
    assertThatThrownBy(() -> bank.processWithBank(id))
        .isInstanceOf(BusinessPaymentException.class)
        .extracting(ex -> ((BusinessPaymentException) ex).getErrorCode())
        .isEqualTo("BANK_DECLINED");
  }
}
