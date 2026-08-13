package com.vibhu.payment.worker;

import com.vibhu.payment.service.BankService;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import io.camunda.zeebe.spring.client.annotation.Variable;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "payment.orchestration-mode", havingValue = "zeebe")
public class AccountValidationWorker {
  private final BankService bank;

  public AccountValidationWorker(BankService bank) {
    this.bank = bank;
  }

  @JobWorker(type = "account-validation")
  public Map<String, Object> accountValidation(@Variable String paymentId) {
    return bank.validateAccount(paymentId);
  }

  @JobWorker(type = "credit-check")
  public Map<String, Object> creditCheck(@Variable String paymentId) {
    return bank.creditCheck(paymentId);
  }
}
