package com.example.payment.service;

import com.example.payment.dto.*;
import com.example.payment.entity.Customer;
import com.example.payment.entity.Payment;
import com.example.payment.entity.PaymentStatus;
import com.example.payment.exception.NotFoundException;
import com.example.payment.repository.CustomerRepository;
import com.example.payment.repository.PaymentRepository;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class PaymentService implements DisposableBean {

    private static final int VIRTUAL_DEMO_TOTAL = 10_000;

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final TransactionService transactionService;
    private final PaymentEventPublisher eventPublisher;
    private final PaymentRetryCompletionService retryCompletionService;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "payment-retry-scheduler");
        t.setDaemon(true);
        return t;
    });

    public PaymentService(PaymentRepository paymentRepository, CustomerRepository customerRepository,
            TransactionService transactionService, PaymentEventPublisher eventPublisher,
            PaymentRetryCompletionService retryCompletionService) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.transactionService = transactionService;
        this.eventPublisher = eventPublisher;
        this.retryCompletionService = retryCompletionService;
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> list(int page, int size, String status, Long customerId, String q,
            String sort) {
        Pageable pageable = PageRequest.of(page, Math.min(Math.max(size, 1), 200), parseSort(sort));
        PaymentStatus statusEnum = parseStatus(status);
        String query = (q == null || q.isBlank()) ? null : q.trim();
        Page<Payment> result = paymentRepository.search(statusEnum, customerId, query, pageable);
        List<PaymentResponse> content = result.getContent()
                .stream()
                .map(this::toResponse)
                .toList();
        return new PageResponse<>(content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public PaymentResponse getById(Long id) {
        Payment payment = paymentRepository.findByIdWithCustomer(id)
                .orElseThrow(() -> new NotFoundException("PAYMENT_NOT_FOUND", "Payment " + id + " not found"));
        return toResponse(payment);
    }

    @Transactional
    public PaymentResponse create(CreatePaymentRequest request, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existing = paymentRepository.findByIdempotencyKey(idempotencyKey.trim());
            if (existing.isPresent()) {
                return toResponse(paymentRepository.findByIdWithCustomer(existing.get()
                                .getId())
                        .orElse(existing.get()));
            }
        }

        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new NotFoundException("CUSTOMER_NOT_FOUND",
                        "Customer " + request.customerId() + " not found"));

        Instant now = Instant.now();
        Payment payment = new Payment();
        payment.setAmount(request.amount()
                .setScale(2, RoundingMode.HALF_UP));
        payment.setCurrency(request.currency()
                .toUpperCase(Locale.ROOT));
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCustomer(customer);
        payment.setReference("PAY-" + UUID.randomUUID()
                .toString()
                .substring(0, 8)
                .toUpperCase(Locale.ROOT));
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            payment.setIdempotencyKey(idempotencyKey.trim());
        }
        payment.setCreatedAt(now);
        payment.setUpdatedAt(now);

        Payment saved = paymentRepository.save(payment);
        transactionService.record(saved, PaymentStatus.PENDING, "Payment created");
        eventPublisher.publish(saved);
        return toResponse(paymentRepository.findByIdWithCustomer(saved.getId())
                .orElse(saved));
    }

    @Transactional
    public PaymentResponse retry(Long id, String idempotencyKey) {
        // Idempotency via dedicated key: if a prior retry used this key, return that payment
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var byKey = paymentRepository.findByIdempotencyKey(idempotencyKey.trim());
            if (byKey.isPresent()) {
                return toResponse(paymentRepository.findByIdWithCustomer(byKey.get()
                                .getId())
                        .orElse(byKey.get()));
            }
        }

        Payment payment = paymentRepository.findByIdWithCustomer(id)
                .orElseThrow(() -> new NotFoundException("PAYMENT_NOT_FOUND", "Payment " + id + " not found"));

        // Idempotent by payment id when already SUCCESS or currently PROCESSING
        if (payment.getStatus() == PaymentStatus.SUCCESS || payment.getStatus() == PaymentStatus.PROCESSING) {
            return toResponse(payment);
        }
        if (payment.getStatus() != PaymentStatus.FAILED && payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Only FAILED or PENDING payments can be retried");
        }

        payment.setStatus(PaymentStatus.PROCESSING);
        payment.setUpdatedAt(Instant.now());
        if (idempotencyKey != null && !idempotencyKey.isBlank() && payment.getIdempotencyKey() == null) {
            payment.setIdempotencyKey(idempotencyKey.trim());
        }
        Payment saved = paymentRepository.save(payment);
        transactionService.record(saved, PaymentStatus.PROCESSING, "Retry accepted — processing");
        eventPublisher.publish(saved);

        Long paymentId = saved.getId();
        scheduler.schedule(() -> retryCompletionService.complete(paymentId), 2, TimeUnit.SECONDS);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> transactions(Long paymentId) {
        if (!paymentRepository.existsById(paymentId)) {
            throw new NotFoundException("PAYMENT_NOT_FOUND", "Payment " + paymentId + " not found");
        }
        return transactionService.listForPayment(paymentId);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> listCustomers() {
        return customerRepository.findAll()
                .stream()
                .map(c -> new CustomerResponse(c.getId(), c.getName(), c.getEmail(), c.getCountry()))
                .toList();
    }

    public PageResponse<PaymentResponse> largePaymentsDemo(int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 500);
        int safePage = Math.max(page, 0);
        int from = safePage * safeSize;
        if (from >= VIRTUAL_DEMO_TOTAL) {
            return new PageResponse<>(List.of(),
                    safePage,
                    safeSize,
                    VIRTUAL_DEMO_TOTAL,
                    (VIRTUAL_DEMO_TOTAL + safeSize - 1) / safeSize);
        }
        int to = Math.min(from + safeSize, VIRTUAL_DEMO_TOTAL);
        List<PaymentResponse> rows = new ArrayList<>(to - from);
        PaymentStatus[] statuses = PaymentStatus.values();
        Instant base = Instant.parse("2024-01-01T00:00:00Z");
        for (int i = from; i < to; i++) {
            long id = i + 1L;
            PaymentStatus status = statuses[i % statuses.length];
            rows.add(new PaymentResponse(id,
                    BigDecimal.valueOf(10 + (i % 990))
                            .setScale(2, RoundingMode.HALF_UP),
                    i % 2 == 0 ? "USD" : "EUR",
                    status,
                    (id % 3) + 1,
                    "Demo Customer " + ((id % 3) + 1),
                    "demo" + ((id % 3) + 1) + "@example.com",
                    "VIRT-" + String.format("%05d", id),
                    base.plusSeconds(id * 60L),
                    base.plusSeconds(id * 60L + 30)));
        }
        int totalPages = (VIRTUAL_DEMO_TOTAL + safeSize - 1) / safeSize;
        return new PageResponse<>(rows, safePage, safeSize, VIRTUAL_DEMO_TOTAL, totalPages);
    }

    private PaymentResponse toResponse(Payment payment) {
        Customer c = payment.getCustomer();
        return new PaymentResponse(payment.getId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus(),
                c != null ? c.getId() : null,
                c != null ? c.getName() : null,
                c != null ? c.getEmail() : null,
                payment.getReference(),
                payment.getCreatedAt(),
                payment.getUpdatedAt());
    }

    private static PaymentStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return PaymentStatus.valueOf(status.trim()
                    .toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
    }

    private static Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sort.split(",");
        String property = parts[0].trim();
        Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim()) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return switch (property) {
            case "amount", "status", "createdAt", "updatedAt", "reference", "id" -> Sort.by(direction, property);
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    @Override
    public void destroy() {
        scheduler.shutdownNow();
    }
}
