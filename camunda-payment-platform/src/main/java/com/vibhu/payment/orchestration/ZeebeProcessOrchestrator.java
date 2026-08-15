package com.vibhu.payment.orchestration;

import com.vibhu.payment.model.PaymentRequest;
import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.response.ProcessInstanceEvent;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Starts / correlates against real Zeebe (Camunda 8). Requires profile {@code zeebe} and a running
 * gateway (see docker-compose.yml).
 */
@Service
@ConditionalOnProperty(name = "payment.orchestration-mode", havingValue = "zeebe")
public class ZeebeProcessOrchestrator implements ProcessOrchestrator {
  public static final String PROCESS_ID = "payment-process";
  public static final String BANK_MESSAGE = "bank-callback";

  private static final Logger log = LoggerFactory.getLogger(ZeebeProcessOrchestrator.class);

  private final ZeebeClient zeebeClient;

  public ZeebeProcessOrchestrator(ZeebeClient zeebeClient) {
    this.zeebeClient = zeebeClient;
  }

  @Override
  public String startPaymentProcess(PaymentRequest request, Map<String, Object> variables) {
    Map<String, Object> vars = new HashMap<>(variables);
    vars.put("paymentId", request.paymentId());
    vars.put("customerId", request.customerId());
    vars.put("amount", request.amount());
    vars.put("currency", request.currency());

    ProcessInstanceEvent event =
        zeebeClient
            .newCreateInstanceCommand()
            .bpmnProcessId(PROCESS_ID)
            .latestVersion()
            .variables(vars)
            .send()
            .join();

    log.info(
        "zeebe process started paymentId={} key={}",
        request.paymentId(),
        event.getProcessInstanceKey());
    return Long.toString(event.getProcessInstanceKey());
  }

  @Override
  public void publishBankCallback(String paymentId, String bankReference, String result) {
    zeebeClient
        .newPublishMessageCommand()
        .messageName(BANK_MESSAGE)
        .correlationKey(paymentId)
        .variables(Map.of("bankReference", bankReference, "bankResult", result))
        .send()
        .join();
  }

  @Override
  public void completeManagerApproval(String paymentId, boolean approved) {
    // Production: complete via Tasklist / user task API with job key.
    // Lab documents Tasklist claim/complete; Zeebe user tasks are jobs of type manager-approval.
    throw new UnsupportedOperationException(
        "Complete manager-approval via Tasklist or Zeebe user-task job worker in zeebe profile");
  }
}
