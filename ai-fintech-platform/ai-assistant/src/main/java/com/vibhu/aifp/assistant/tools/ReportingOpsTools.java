package com.vibhu.aifp.assistant.tools;

import com.vibhu.aifp.assistant.security.UserContextHolder;
import com.vibhu.aifp.domain.ReportingService;
import com.vibhu.aifp.domain.ToolAuthorizationService;
import java.util.Map;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class ReportingOpsTools {

  private final ReportingService reportingService;
  private final ToolAuthorizationService authorizationService;

  public ReportingOpsTools(
      ReportingService reportingService, ToolAuthorizationService authorizationService) {
    this.reportingService = reportingService;
    this.authorizationService = authorizationService;
  }

  @Tool(description = "Generate payment report for customer. Read-only.")
  public Map<String, Object> generatePaymentReport(String customerId) {
    authorizationService.authorize(UserContextHolder.get(), "generatePaymentReport");
    return reportingService.generatePaymentReport(customerId);
  }

  @Tool(description = "Daily failure summary. Read-only.")
  public Map<String, Object> getDailyFailureSummary(String date) {
    authorizationService.authorize(UserContextHolder.get(), "getDailyFailureSummary");
    java.time.LocalDate target =
        date == null || date.isBlank() ? java.time.LocalDate.now() : java.time.LocalDate.parse(date);
    return reportingService.getDailyFailureSummary(target);
  }
}
