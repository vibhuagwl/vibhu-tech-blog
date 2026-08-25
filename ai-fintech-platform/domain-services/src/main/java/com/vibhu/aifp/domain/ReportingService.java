package com.vibhu.aifp.domain;

import com.vibhu.aifp.common.PaymentRecord;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ReportingService {

  private final PaymentService paymentService;

  public ReportingService(PaymentService paymentService) {
    this.paymentService = paymentService;
  }

  public Map<String, Object> generatePaymentReport(String customerId) {
    List<PaymentRecord> payments = paymentService.searchPayments(customerId, null);
    Map<String, Long> byStatus =
        payments.stream().collect(Collectors.groupingBy(PaymentRecord::status, Collectors.counting()));
    Map<String, Object> report = new HashMap<>();
    report.put("customerId", customerId);
    report.put("paymentCount", payments.size());
    report.put("byStatus", byStatus);
    report.put("payments", payments);
    return report;
  }

  public Map<String, Object> getDailyFailureSummary(LocalDate date) {
  LocalDate target = date == null ? LocalDate.now() : date;
    List<PaymentRecord> failed = paymentService.searchPayments(null, "FAILED");
    Map<String, Long> byCode =
        failed.stream()
            .filter(p -> p.failureCode() != null)
            .collect(Collectors.groupingBy(PaymentRecord::failureCode, Collectors.counting()));
    return Map.of(
        "date", target.toString(),
        "failedCount", failed.size(),
        "failureCodes", byCode,
        "topBank", "HSBC");
  }
}
