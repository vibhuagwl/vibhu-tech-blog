package com.vibhu.payment.worker;

import com.vibhu.payment.service.FraudService;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import io.camunda.zeebe.spring.client.annotation.Variable;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "payment.orchestration-mode", havingValue = "zeebe")
public class FraudCheckWorker {
  private final FraudService fraud;

  public FraudCheckWorker(FraudService fraud) {
    this.fraud = fraud;
  }

  @JobWorker(type = "fraud-check")
  public Map<String, Object> fraudCheck(@Variable String paymentId) {
    return fraud.check(paymentId);
  }
}
