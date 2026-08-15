package com.vibhu.payment.orchestration;

import com.vibhu.payment.exception.BusinessPaymentException;
import com.vibhu.payment.exception.PaymentException;
import com.vibhu.payment.model.PaymentRequest;
import com.vibhu.payment.model.PaymentStatus;
import com.vibhu.payment.service.BankService;
import com.vibhu.payment.service.FraudService;
import com.vibhu.payment.service.NotificationService;
import com.vibhu.payment.service.PaymentService;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Deterministic stand-in for Zeebe when profile is default/in-memory. Mirrors payment-process.bpmn
 * so API + worker business logic can be tested without Docker.
 */
@Service
@ConditionalOnProperty(
    name = "payment.orchestration-mode",
    havingValue = "in-memory",
    matchIfMissing = true)
public class InMemoryProcessOrchestrator implements ProcessOrchestrator {
  private static final Logger log = LoggerFactory.getLogger(InMemoryProcessOrchestrator.class);

  private final PaymentService payments;
  private final FraudService fraud;
  private final BankService bank;
  private final NotificationService notifications;
  private final Map<String, String> waitingForBank = new ConcurrentHashMap<>();
  private final Map<String, Boolean> pendingApprovals = new ConcurrentHashMap<>();

  public InMemoryProcessOrchestrator(
      PaymentService payments,
      FraudService fraud,
      BankService bank,
      NotificationService notifications) {
    this.payments = payments;
    this.fraud = fraud;
    this.bank = bank;
    this.notifications = notifications;
  }

  @Override
  public String startPaymentProcess(PaymentRequest request, Map<String, Object> variables) {
    String processInstanceId = "mem-" + UUID.randomUUID();
    payments.attachProcessInstance(request.paymentId(), processInstanceId);
    log.info(
        "in-memory process started paymentId={} processInstanceId={}",
        request.paymentId(),
        processInstanceId);

    Map<String, Object> vars = payments.validate(request.paymentId());
    Map<String, Object> fraudResult = fraud.check(request.paymentId());
    boolean fraudDetected = Boolean.TRUE.equals(fraudResult.get("fraudDetected"));
    if (fraudDetected) {
      notifications.notifyCustomer(request.paymentId(), PaymentStatus.FRAUD_REJECTED.name());
      return processInstanceId;
    }

    boolean requiresApproval = Boolean.TRUE.equals(vars.get("requiresApproval"));
    if (requiresApproval) {
      payments.markStatus(request.paymentId(), PaymentStatus.AWAITING_APPROVAL);
      pendingApprovals.put(request.paymentId(), Boolean.TRUE);
      // Wait for completeManagerApproval — mirrors user task + optional timer.
      return processInstanceId;
    }

    continueAfterApproval(request.paymentId(), processInstanceId);
    return processInstanceId;
  }

  @Override
  public void completeManagerApproval(String paymentId, boolean approved) {
    if (!pendingApprovals.containsKey(paymentId)) {
      throw new PaymentException("no pending approval for " + paymentId);
    }
    pendingApprovals.remove(paymentId);
    if (!approved) {
      payments.markStatus(paymentId, PaymentStatus.REJECTED);
      notifications.notifyCustomer(paymentId, PaymentStatus.REJECTED.name());
      return;
    }
    payments.markStatus(paymentId, PaymentStatus.APPROVED);
    String processInstanceId = payments.require(paymentId).getProcessInstanceKey();
    continueAfterApproval(paymentId, processInstanceId);
  }

  private void continueAfterApproval(String paymentId, String processInstanceId) {
    bank.validateAccount(paymentId);
    bank.creditCheck(paymentId);
    try {
      Map<String, Object> bankResult = bank.processWithBank(paymentId);
      waitingForBank.put(paymentId, String.valueOf(bankResult.get("bankReference")));
      // Auto-correlate happy path in-memory (Zeebe waits for message).
      publishBankCallback(paymentId, String.valueOf(bankResult.get("bankReference")), "SUCCESS");
    } catch (BusinessPaymentException ex) {
      payments.markStatus(paymentId, PaymentStatus.MANUAL_REVIEW);
      notifications.notifyCustomer(paymentId, PaymentStatus.MANUAL_REVIEW.name());
    }
  }

  @Override
  public void publishBankCallback(String paymentId, String bankReference, String result) {
    waitingForBank.remove(paymentId);
    if ("SUCCESS".equalsIgnoreCase(result)) {
      payments.complete(paymentId, bankReference);
      notifications.notifyCustomer(paymentId, PaymentStatus.COMPLETED.name());
    } else {
      payments.markStatus(paymentId, PaymentStatus.MANUAL_REVIEW);
      notifications.notifyCustomer(paymentId, PaymentStatus.MANUAL_REVIEW.name());
    }
  }
}
