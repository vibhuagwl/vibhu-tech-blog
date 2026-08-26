package com.vibhu.sapi.payment.config;

import com.vibhu.sapi.dto.KafkaEventView;
import com.vibhu.sapi.payment.entity.BankResponseEntity;
import com.vibhu.sapi.payment.entity.CustomerProfileEntity;
import com.vibhu.sapi.payment.entity.PaymentEntity;
import com.vibhu.sapi.payment.entity.PaymentHistoryEntity;
import com.vibhu.sapi.payment.entity.PaymentRetryEntity;
import com.vibhu.sapi.payment.kafka.InMemoryKafkaEventStore;
import com.vibhu.sapi.payment.repo.BankResponseRepository;
import com.vibhu.sapi.payment.repo.CustomerProfileRepository;
import com.vibhu.sapi.payment.repo.PaymentHistoryRepository;
import com.vibhu.sapi.payment.repo.PaymentRepository;
import com.vibhu.sapi.payment.repo.PaymentRetryRepository;
import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

  @Bean
  CommandLineRunner seedTxn1001(
      PaymentRepository paymentRepository,
      PaymentHistoryRepository historyRepository,
      BankResponseRepository bankResponseRepository,
      PaymentRetryRepository retryRepository,
      CustomerProfileRepository customerProfileRepository,
      InMemoryKafkaEventStore kafkaEventStore) {
    return args -> {
      if (paymentRepository.existsById("TXN-1001")) {
        return;
      }

      Instant t0 = Instant.parse("2026-08-25T08:00:00Z");
      Instant t1 = Instant.parse("2026-08-25T08:00:05Z");
      Instant t2 = Instant.parse("2026-08-25T08:00:10Z");
      Instant t3 = Instant.parse("2026-08-25T08:01:00Z");
      Instant t4 = Instant.parse("2026-08-25T08:02:00Z");
      Instant t5 = Instant.parse("2026-08-25T08:05:00Z");
      Instant t6 = Instant.parse("2026-08-25T08:10:00Z");

      PaymentEntity payment = new PaymentEntity();
      payment.setPaymentId("TXN-1001");
      payment.setCustomerId("CUST-5001");
      payment.setAmount(new BigDecimal("250000.00"));
      payment.setCurrency("INR");
      payment.setRail("NEFT");
      payment.setBank("BANK-ABC");
      payment.setStatus("FAILED");
      payment.setFailureCode("BEN-001");
      payment.setFailureReason("BENEFICIARY_INVALID");
      payment.setRetryCount(3);
      payment.setRetryAllowed(false);
      payment.setCreatedAt(t0);
      payment.setUpdatedAt(t6);
      paymentRepository.save(payment);

      saveHistory(historyRepository, "TXN-1001", "CREATED", "PENDING", "Payment initiated", t0);
      saveHistory(historyRepository, "TXN-1001", "VALIDATED", "PENDING", "Internal validation passed", t1);
      saveHistory(historyRepository, "TXN-1001", "SUBMITTED", "PROCESSING", "Submitted to BANK-ABC NEFT rail", t2);
      saveHistory(historyRepository, "TXN-1001", "RETRY_1", "PROCESSING", "Retry attempt 1 — bank timeout", t3);
      saveHistory(historyRepository, "TXN-1001", "RETRY_2", "PROCESSING", "Retry attempt 2 — beneficiary validation", t4);
      saveHistory(historyRepository, "TXN-1001", "RETRY_3", "PROCESSING", "Retry attempt 3 — beneficiary validation", t5);
      saveHistory(historyRepository, "TXN-1001", "FAILED", "FAILED", "Max retries exhausted — BEN-001", t6);

      BankResponseEntity bank = new BankResponseEntity();
      bank.setPaymentId("TXN-1001");
      bank.setBusinessCode("BEN-001");
      bank.setMessage("Beneficiary account validation failed");
      bank.setRawResponse(
          "{\"businessCode\":\"BEN-001\",\"message\":\"Beneficiary account validation failed\",\"rail\":\"NEFT\"}");
      bank.setReceivedAt(t6);
      bankResponseRepository.save(bank);

      saveRetry(retryRepository, "TXN-1001", 1, "FAILED", "BEN-001", "Beneficiary account validation failed", t3);
      saveRetry(retryRepository, "TXN-1001", 2, "FAILED", "BEN-001", "Beneficiary account validation failed", t4);
      saveRetry(retryRepository, "TXN-1001", 3, "FAILED", "BEN-001", "Beneficiary account validation failed", t5);

      CustomerProfileEntity customer = new CustomerProfileEntity();
      customer.setCustomerId("CUST-5001");
      customer.setName("Acme Exports Pvt Ltd");
      customer.setSegment("SME");
      customer.setRiskTier("MEDIUM");
      customer.setFailedPaymentsLast30Days(2);
      customer.setTotalPaymentsLast30Days(45);
      customerProfileRepository.save(customer);

      kafkaEventStore.append(
          new KafkaEventView(
              "EVT-1001-1",
              "payments.outbound",
              "TXN-1001",
              "PaymentCreated",
              "{\"paymentId\":\"TXN-1001\",\"amount\":250000,\"currency\":\"INR\"}",
              t0));
      kafkaEventStore.append(
          new KafkaEventView(
              "EVT-1001-2",
              "payments.outbound",
              "TXN-1001",
              "PaymentSubmitted",
              "{\"paymentId\":\"TXN-1001\",\"bank\":\"BANK-ABC\",\"rail\":\"NEFT\"}",
              t2));
      kafkaEventStore.append(
          new KafkaEventView(
              "EVT-1001-3",
              "payments.failed",
              "TXN-1001",
              "PaymentFailed",
              "{\"paymentId\":\"TXN-1001\",\"failureCode\":\"BEN-001\",\"retryCount\":3}",
              t6));
    };
  }

  private static void saveHistory(
      PaymentHistoryRepository repo,
      String paymentId,
      String event,
      String status,
      String detail,
      Instant at) {
    PaymentHistoryEntity h = new PaymentHistoryEntity();
    h.setPaymentId(paymentId);
    h.setEvent(event);
    h.setStatus(status);
    h.setDetail(detail);
    h.setOccurredAt(at);
    repo.save(h);
  }

  private static void saveRetry(
      PaymentRetryRepository repo,
      String paymentId,
      int attempt,
      String status,
      String failureCode,
      String detail,
      Instant at) {
    PaymentRetryEntity r = new PaymentRetryEntity();
    r.setPaymentId(paymentId);
    r.setAttempt(attempt);
    r.setStatus(status);
    r.setFailureCode(failureCode);
    r.setDetail(detail);
    r.setAttemptedAt(at);
    repo.save(r);
  }
}
