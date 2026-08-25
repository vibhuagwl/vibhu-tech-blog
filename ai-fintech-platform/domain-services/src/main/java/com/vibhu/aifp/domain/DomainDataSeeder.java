package com.vibhu.aifp.domain;

import com.vibhu.aifp.common.CustomerRecord;
import com.vibhu.aifp.common.KafkaMessageRecord;
import com.vibhu.aifp.common.PaymentRecord;
import com.vibhu.aifp.common.TransactionRecord;
import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class DomainDataSeeder {

  private final Map<String, PaymentRecord> payments = new ConcurrentHashMap<>();
  private final Map<String, CustomerRecord> customers = new ConcurrentHashMap<>();
  private final Map<String, List<TransactionRecord>> customerTransactions = new ConcurrentHashMap<>();
  private final Map<String, KafkaMessageRecord> kafkaMessages = new ConcurrentHashMap<>();

  @PostConstruct
  void seed() {
    payments.put(
        "PAY-123",
        new PaymentRecord(
            "PAY-123",
            "CUST-100",
            new BigDecimal("1500.00"),
            "GBP",
            "FAILED",
            "HSBC",
            "BANK_TIMEOUT",
            true,
            Instant.parse("2026-08-20T10:15:00Z")));

    payments.put(
        "PAY-200",
        new PaymentRecord(
            "PAY-200",
            "CUST-100",
            new BigDecimal("250.00"),
            "GBP",
            "SETTLED",
            "HSBC",
            null,
            false,
            Instant.parse("2026-08-19T09:00:00Z")));

    customers.put(
        "CUST-100",
        new CustomerRecord("CUST-100", "Acme Trading Ltd", "ops@acme.example", "SME", "MEDIUM"));

    customerTransactions.put(
        "CUST-100",
        List.of(
            new TransactionRecord(
                "TXN-9001",
                "PAY-123",
                "CUST-100",
                "DEBIT",
                new BigDecimal("1500.00"),
                "FAILED",
                Instant.parse("2026-08-20T10:15:00Z")),
            new TransactionRecord(
                "TXN-9000",
                "PAY-200",
                "CUST-100",
                "DEBIT",
                new BigDecimal("250.00"),
                "SETTLED",
                Instant.parse("2026-08-19T09:00:00Z"))));

    kafkaMessages.put(
        "MSG-501",
        new KafkaMessageRecord(
            "MSG-501",
            "payments.outbound",
            2,
            88421L,
            "PAY-123",
            "{\"paymentId\":\"PAY-123\",\"status\":\"FAILED\",\"failureCode\":\"BANK_TIMEOUT\"}",
            "FAILED",
            "BANK_TIMEOUT",
            Instant.parse("2026-08-20T10:15:05Z")));
  }

  Map<String, PaymentRecord> payments() {
    return payments;
  }

  Map<String, CustomerRecord> customers() {
    return customers;
  }

  Map<String, List<TransactionRecord>> customerTransactions() {
    return customerTransactions;
  }

  Map<String, KafkaMessageRecord> kafkaMessages() {
    return kafkaMessages;
  }
}
