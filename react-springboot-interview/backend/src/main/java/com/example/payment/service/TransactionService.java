package com.example.payment.service;

import com.example.payment.dto.TransactionResponse;
import com.example.payment.entity.Payment;
import com.example.payment.entity.PaymentStatus;
import com.example.payment.entity.PaymentTransaction;
import com.example.payment.repository.PaymentTransactionRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransactionService {

    private final PaymentTransactionRepository transactionRepository;

    public TransactionService(PaymentTransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public PaymentTransaction record(Payment payment, PaymentStatus status, String message) {
        PaymentTransaction tx = new PaymentTransaction(payment, status, message, Instant.now());
        return transactionRepository.save(tx);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> listForPayment(Long paymentId) {
        return transactionRepository.findByPaymentIdOrderByCreatedAtAsc(paymentId).stream()
                .map(t -> new TransactionResponse(
                        t.getId(),
                        paymentId,
                        t.getStatus(),
                        t.getMessage(),
                        t.getCreatedAt()
                ))
                .toList();
    }
}
