package com.vibhu.aifp.reporting.mcp;

import com.vibhu.aifp.domain.ReportingService;
import java.time.LocalDate;
import java.util.Map;
import org.springaicommunity.mcp.annotation.McpResource;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

@Component
public class ReportingMcpTools {

  private final ReportingService reportingService;

  public ReportingMcpTools(ReportingService reportingService) {
    this.reportingService = reportingService;
  }

  @McpTool(name = "generatePaymentReport", description = "Payment report for customer")
  public Map<String, Object> generatePaymentReport(
      @McpToolParam(description = "Customer id", required = true) String customerId) {
    return reportingService.generatePaymentReport(customerId);
  }

  @McpTool(name = "getDailyFailureSummary", description = "Daily failed payment summary")
  public Map<String, Object> getDailyFailureSummary(
      @McpToolParam(description = "ISO date", required = false) String date) {
    LocalDate target = date == null || date.isBlank() ? LocalDate.now() : LocalDate.parse(date);
    return reportingService.getDailyFailureSummary(target);
  }

  @McpResource(
      uri = "reporting://templates/daily-failures",
      name = "daily-failure-template",
      description = "Daily failure report template")
  public String dailyTemplate() {
    return "Summarize failedCount, failureCodes, and topBank for the operations standup.";
  }
}
