package com.vibhu.sapi.payment.service;

import com.vibhu.sapi.dto.ApprovalRequest;
import com.vibhu.sapi.dto.BankResponseView;
import com.vibhu.sapi.dto.CustomerPaymentProfile;
import com.vibhu.sapi.dto.InvestigationCaseView;
import com.vibhu.sapi.dto.KafkaEventView;
import com.vibhu.sapi.dto.PaymentHistoryEntry;
import com.vibhu.sapi.dto.PaymentView;
import com.vibhu.sapi.dto.RetryHistoryEntry;
import com.vibhu.sapi.exception.ApprovalRequiredException;
import com.vibhu.sapi.payment.entity.BankResponseEntity;
import com.vibhu.sapi.payment.entity.CustomerProfileEntity;
import com.vibhu.sapi.payment.entity.InvestigationCaseEntity;
import com.vibhu.sapi.payment.entity.PaymentEntity;
import com.vibhu.sapi.payment.kafka.InMemoryKafkaEventStore;
import com.vibhu.sapi.payment.repo.BankResponseRepository;
import com.vibhu.sapi.payment.repo.CustomerProfileRepository;
import com.vibhu.sapi.payment.repo.InvestigationCaseRepository;
import com.vibhu.sapi.payment.repo.PaymentHistoryRepository;
import com.vibhu.sapi.payment.repo.PaymentRepository;
import com.vibhu.sapi.payment.repo.PaymentRetryRepository;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PaymentApplicationService {

  private final PaymentRepository paymentRepository;
  private final PaymentHistoryRepository historyRepository;
  private final BankResponseRepository bankResponseRepository;
  private final PaymentRetryRepository retryRepository;
  private final CustomerProfileRepository customerProfileRepository;
  private final InvestigationCaseRepository investigationCaseRepository;
  private final InMemoryKafkaEventStore kafkaEventStore;

  public PaymentApplicationService(
      PaymentRepository paymentRepository,
      PaymentHistoryRepository historyRepository,
      BankResponseRepository bankResponseRepository,
      PaymentRetryRepository retryRepository,
      CustomerProfileRepository customerProfileRepository,
      InvestigationCaseRepository investigationCaseRepository,
      InMemoryKafkaEventStore kafkaEventStore) {
    this.paymentRepository = paymentRepository;
    this.historyRepository = historyRepository;
    this.bankResponseRepository = bankResponseRepository;
    this.retryRepository = retryRepository;
    this.customerProfileRepository = customerProfileRepository;
    this.investigationCaseRepository = investigationCaseRepository;
    this.kafkaEventStore = kafkaEventStore;
  }

  public PaymentView getPayment(String paymentId) {
    return toView(requirePayment(paymentId));
  }

  public String getPaymentStatus(String paymentId) {
    return requirePayment(paymentId).getStatus();
  }

  public List<PaymentHistoryEntry> getPaymentHistory(String paymentId) {
    requirePayment(paymentId);
    return historyRepository.findByPaymentIdOrderByOccurredAtAsc(normalize(paymentId)).stream()
        .map(
            h ->
                new PaymentHistoryEntry(
                    h.getPaymentId(), h.getEvent(), h.getStatus(), h.getDetail(), h.getOccurredAt()))
        .toList();
  }

  public BankResponseView getBankResponse(String paymentId) {
    requirePayment(paymentId);
    BankResponseEntity bank =
        bankResponseRepository
            .findById(normalize(paymentId))
            .orElseThrow(() -> new IllegalArgumentException("Bank response not found: " + paymentId));
    return new BankResponseView(
        bank.getPaymentId(),
        bank.getBusinessCode(),
        bank.getMessage(),
        bank.getRawResponse(),
        bank.getReceivedAt());
  }

  public List<RetryHistoryEntry> getPaymentRetryHistory(String paymentId) {
    requirePayment(paymentId);
    return retryRepository.findByPaymentIdOrderByAttemptAsc(normalize(paymentId)).stream()
        .map(
            r ->
                new RetryHistoryEntry(
                    r.getAttempt(), r.getStatus(), r.getFailureCode(), r.getDetail(), r.getAttemptedAt()))
        .toList();
  }

  public CustomerPaymentProfile getCustomerPaymentProfile(String paymentId) {
    PaymentEntity payment = requirePayment(paymentId);
    CustomerProfileEntity profile =
        customerProfileRepository
            .findById(payment.getCustomerId())
            .orElseThrow(
                () -> new IllegalArgumentException("Customer not found: " + payment.getCustomerId()));
    return new CustomerPaymentProfile(
        profile.getCustomerId(),
        profile.getName(),
        profile.getSegment(),
        profile.getRiskTier(),
        profile.getFailedPaymentsLast30Days(),
        profile.getTotalPaymentsLast30Days());
  }

  public List<KafkaEventView> getRelatedKafkaEvents(String paymentId) {
    requirePayment(paymentId);
    return kafkaEventStore.findByPaymentId(normalize(paymentId));
  }

  @Transactional
  public InvestigationCaseView createInvestigationCase(String paymentId, String reason) {
    PaymentEntity payment = requirePayment(paymentId);
    String caseId = "CASE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    InvestigationCaseEntity entity = new InvestigationCaseEntity();
    entity.setCaseId(caseId);
    entity.setPaymentId(payment.getPaymentId());
    entity.setStatus("OPEN");
    entity.setReason(reason);
    entity.setCreatedAt(Instant.now());
    investigationCaseRepository.save(entity);
    return new InvestigationCaseView(caseId, payment.getPaymentId(), "OPEN", reason, entity.getCreatedAt());
  }

  @Transactional
  public PaymentView executePayment(String paymentId, boolean approved) {
    if (!approved) {
      ApprovalRequest pending =
          new ApprovalRequest(
              UUID.randomUUID().toString(),
              "payment.execute",
              paymentId,
              "ai-agent",
              "PENDING",
              Instant.now(),
              "{\"paymentId\":\"" + paymentId + "\"}");
      throw new ApprovalRequiredException(pending);
    }
    PaymentEntity payment = requirePayment(paymentId);
    payment.setStatus("PROCESSING");
    payment.setUpdatedAt(Instant.now());
    return toView(paymentRepository.save(payment));
  }

  @Transactional
  public PaymentView retryPayment(String paymentId, boolean approved) {
    if (!approved) {
      ApprovalRequest pending =
          new ApprovalRequest(
              UUID.randomUUID().toString(),
              "payment.retry",
              paymentId,
              "ai-agent",
              "PENDING",
              Instant.now(),
              "{\"paymentId\":\"" + paymentId + "\"}");
      throw new ApprovalRequiredException(pending);
    }
    PaymentEntity payment = requirePayment(paymentId);
    payment.setStatus("RETRYING");
    payment.setUpdatedAt(Instant.now());
    return toView(paymentRepository.save(payment));
  }

  private PaymentEntity requirePayment(String paymentId) {
    return paymentRepository
        .findById(normalize(paymentId))
        .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));
  }

  private static String normalize(String paymentId) {
    return paymentId == null ? "" : paymentId.trim().toUpperCase(Locale.ROOT);
  }

  private static PaymentView toView(PaymentEntity p) {
    return new PaymentView(
        p.getPaymentId(),
        p.getCustomerId(),
        p.getAmount(),
        p.getCurrency(),
        p.getRail(),
        p.getBank(),
        p.getStatus(),
        p.getFailureCode(),
        p.getFailureReason(),
        p.getRetryCount(),
        p.isRetryAllowed(),
        p.getCreatedAt(),
        p.getUpdatedAt());
  }
}
