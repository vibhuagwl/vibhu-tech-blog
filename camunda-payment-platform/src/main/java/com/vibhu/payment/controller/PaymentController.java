package com.vibhu.payment.controller;

import com.vibhu.payment.entity.PaymentEntity;
import com.vibhu.payment.model.BankCallbackRequest;
import com.vibhu.payment.model.PaymentRequest;
import com.vibhu.payment.model.PaymentResponse;
import com.vibhu.payment.model.PaymentStatus;
import com.vibhu.payment.orchestration.ProcessOrchestrator;
import com.vibhu.payment.service.PaymentService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
  private final PaymentService payments;
  private final ProcessOrchestrator orchestrator;

  public PaymentController(PaymentService payments, ProcessOrchestrator orchestrator) {
    this.payments = payments;
    this.orchestrator = orchestrator;
  }

  @PostMapping
  public ResponseEntity<PaymentResponse> create(@Valid @RequestBody PaymentRequest request) {
    PaymentEntity entity = payments.createStarted(request);
    String processInstanceId =
        orchestrator.startPaymentProcess(
            request,
            Map.of(
                "paymentId", request.paymentId(),
                "customerId", request.customerId(),
                "amount", request.amount(),
                "currency", request.currency()));
    payments.attachProcessInstance(entity.getPaymentId(), processInstanceId);
    PaymentEntity latest = payments.require(request.paymentId());
    return ResponseEntity.status(HttpStatus.ACCEPTED)
        .body(
            new PaymentResponse(
                latest.getPaymentId(), processInstanceId, latest.getStatus().name()));
  }

  @GetMapping("/{paymentId}")
  public Map<String, Object> get(@PathVariable String paymentId) {
    PaymentEntity p = payments.require(paymentId);
    return Map.of(
        "paymentId", p.getPaymentId(),
        "customerId", p.getCustomerId(),
        "amount", p.getAmount(),
        "currency", p.getCurrency(),
        "status", p.getStatus().name(),
        "processInstanceId", p.getProcessInstanceKey() == null ? "" : p.getProcessInstanceKey(),
        "bankReference", p.getBankReference() == null ? "" : p.getBankReference(),
        "fraudDetected", p.isFraudDetected());
  }

  @PostMapping("/{paymentId}/bank-callback")
  public Map<String, String> bankCallback(
      @PathVariable String paymentId, @Valid @RequestBody BankCallbackRequest request) {
    if (!paymentId.equals(request.paymentId())) {
      return Map.of("status", "MISMATCH");
    }
    orchestrator.publishBankCallback(paymentId, request.bankReference(), request.result());
    return Map.of("status", "CORRELATED");
  }

  @PostMapping("/{paymentId}/approvals")
  public Map<String, String> approval(
      @PathVariable String paymentId, @RequestParam boolean approved) {
    orchestrator.completeManagerApproval(paymentId, approved);
    PaymentStatus status = payments.require(paymentId).getStatus();
    return Map.of("paymentId", paymentId, "status", status.name());
  }
}
