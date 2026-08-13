package com.vibhu.payment.worker;

import com.vibhu.payment.service.NotificationService;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import io.camunda.zeebe.spring.client.annotation.Variable;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "payment.orchestration-mode", havingValue = "zeebe")
public class NotificationWorker {
  private final NotificationService notifications;

  public NotificationWorker(NotificationService notifications) {
    this.notifications = notifications;
  }

  @JobWorker(type = "notify-payment")
  public void notifyPayment(
      @Variable String paymentId, @Variable(name = "bankResult") String bankResult) {
    notifications.notifyCustomer(paymentId, bankResult == null ? "COMPLETED" : bankResult);
  }

  @JobWorker(type = "escalate-approval")
  public void escalate(@Variable String paymentId) {
    notifications.escalateApproval(paymentId);
  }
}
