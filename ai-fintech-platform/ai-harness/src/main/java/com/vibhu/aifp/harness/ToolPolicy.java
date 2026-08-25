package com.vibhu.aifp.harness;

import com.vibhu.aifp.common.Intent;
import com.vibhu.aifp.common.UserContext;
import com.vibhu.aifp.domain.ToolAuthorizationService;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ToolPolicy {

  private final ToolAuthorizationService authorizationService;

  public ToolPolicy(ToolAuthorizationService authorizationService) {
    this.authorizationService = authorizationService;
  }

  public List<String> resolveTools(Intent intent, UserContext user) {
    Set<String> allowed = new LinkedHashSet<>(authorizationService.allowedToolsFor(user));
    if (intent == Intent.GENERAL) {
      return List.copyOf(allowed);
    }
    Set<String> intentTools = new LinkedHashSet<>(toolsForIntent(intent));
    intentTools.retainAll(allowed);
    return List.copyOf(intentTools);
  }

  private Set<String> toolsForIntent(Intent intent) {
    return switch (intent) {
      case PAYMENT_FAILURE_ANALYSIS, PAYMENT_STATUS, RETRY_ADVICE ->
          Set.of(
              "getPayment",
              "getPaymentStatus",
              "getPaymentFailureReason",
              "searchPayments",
              "getCustomer",
              "getCustomerRisk");
      case KAFKA_REPLAY -> Set.of("findFailedMessage", "getMessageDetails", "replayMessage");
      case REPORT -> Set.of("generatePaymentReport", "getDailyFailureSummary", "searchPayments");
      case GENERAL -> Set.of();
    };
  }
}
