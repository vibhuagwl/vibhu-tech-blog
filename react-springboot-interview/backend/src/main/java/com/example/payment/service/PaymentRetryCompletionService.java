package com.example.payment.service;

import com.example.payment.entity.Payment;
import com.example.payment.entity.PaymentStatus;
import com.example.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class PaymentRetryCompletionService {

    private final PaymentRepository paymentRepository;
    private final TransactionService transactionService;
    private final PaymentEventPublisher eventPublisher;

    public PaymentRetryCompletionService(
            PaymentRepository paymentRepository,
            TransactionService transactionService,
            PaymentEventPublisher eventPublisher
    ) {
        this.paymentRepository = paymentRepository;
        this.transactionService = transactionService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public void complete(Long paymentId) {
        Payment payment = paymentRepository.findByIdWithCustomer(paymentId)
                .orElse(null);
        if (payment == null || payment.getStatus() != PaymentStatus.PROCESSING) {
            return;
        }
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setUpdatedAt(Instant.now());
        paymentRepository.save(payment);
        transactionService.record(payment, PaymentStatus.SUCCESS, "Retry completed successfully");
        eventPublisher.publish(payment);
    }
}
