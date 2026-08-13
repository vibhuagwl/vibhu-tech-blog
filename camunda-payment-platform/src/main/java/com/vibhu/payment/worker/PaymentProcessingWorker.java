package com.vibhu.payment.worker;

import com.vibhu.payment.exception.BusinessPaymentException;
import com.vibhu.payment.exception.RetryablePaymentException;
import com.vibhu.payment.service.BankService;
import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.client.api.worker.JobClient;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import io.camunda.zeebe.spring.client.annotation.Variable;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "payment.orchestration-mode", havingValue = "zeebe")
public class PaymentProcessingWorker {
  private final BankService bank;

  public PaymentProcessingWorker(BankService bank) {
    this.bank = bank;
  }

  @JobWorker(type = "process-payment", autoComplete = false)
  public void processPayment(JobClient client, ActivatedJob job, @Variable String paymentId) {
    try {
      Map<String, Object> result = bank.processWithBank(paymentId);
      client.newCompleteCommand(job.getKey()).variables(result).send().join();
    } catch (BusinessPaymentException ex) {
      client
          .newThrowErrorCommand(job.getKey())
          .errorCode(ex.getErrorCode())
          .errorMessage(ex.getMessage())
          .send()
          .join();
    } catch (RetryablePaymentException ex) {
      client
          .newFailCommand(job.getKey())
          .retries(Math.max(job.getRetries() - 1, 0))
          .errorMessage(ex.getMessage())
          .send()
          .join();
    }
  }
}
