package com.vibhu.payment.orchestration;

import com.vibhu.payment.model.PaymentRequest;
import java.util.Map;

public interface ProcessOrchestrator {
  /** Starts payment-process; returns process instance id / key as string. */
  String startPaymentProcess(PaymentRequest request, Map<String, Object> variables);

  /** Correlate bank-callback message by paymentId. */
  void publishBankCallback(String paymentId, String bankReference, String result);

  /** Complete manager approval (in-memory / Tasklist bridge for demos). */
  void completeManagerApproval(String paymentId, boolean approved);
}
