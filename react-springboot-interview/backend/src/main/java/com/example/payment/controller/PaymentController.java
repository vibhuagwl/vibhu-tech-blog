package com.example.payment.controller;

import com.example.payment.dto.*;
import com.example.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/payments")
    public PageResponse<PaymentResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long customer,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort
    ) {
        return paymentService.list(page, size, status, customer, q, sort);
    }

    @GetMapping("/payments/{id:\\d+}")
    public PaymentResponse get(@PathVariable Long id) {
        return paymentService.getById(id);
    }

    @PostMapping("/payments")
    public ResponseEntity<PaymentResponse> create(
            @Valid @RequestBody CreatePaymentRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.create(request, idempotencyKey));
    }

    @PostMapping("/payments/{id:\\d+}/retry")
    public PaymentResponse retry(
            @PathVariable Long id,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        return paymentService.retry(id, idempotencyKey);
    }

    @GetMapping("/payments/{id:\\d+}/transactions")
    public List<TransactionResponse> transactions(@PathVariable Long id) {
        return paymentService.transactions(id);
    }

    @GetMapping("/customers")
    public List<CustomerResponse> customers() {
        return paymentService.listCustomers();
    }

    @GetMapping("/payments/virtual-demo")
    public PageResponse<PaymentResponse> virtualDemo(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return paymentService.largePaymentsDemo(page, size);
    }

    @GetMapping("/demo/large-payments")
    public PageResponse<PaymentResponse> largePayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return paymentService.largePaymentsDemo(page, size);
    }
}
