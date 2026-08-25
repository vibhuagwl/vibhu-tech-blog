package com.vibhu.aifp.domain;

import com.vibhu.aifp.common.Role;
import com.vibhu.aifp.common.ToolRisk;
import com.vibhu.aifp.common.UnauthorizedToolException;
import com.vibhu.aifp.common.UserContext;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class ToolAuthorizationService {

  private static final Map<String, ToolRisk> TOOL_RISKS =
      Map.ofEntries(
          Map.entry("getPayment", ToolRisk.READ),
          Map.entry("getPaymentStatus", ToolRisk.READ),
          Map.entry("getPaymentFailureReason", ToolRisk.READ),
          Map.entry("searchPayments", ToolRisk.READ),
          Map.entry("getCustomer", ToolRisk.READ),
          Map.entry("getCustomerTransactions", ToolRisk.READ),
          Map.entry("getCustomerRisk", ToolRisk.READ),
          Map.entry("findFailedMessage", ToolRisk.READ),
          Map.entry("getMessageDetails", ToolRisk.READ),
          Map.entry("generatePaymentReport", ToolRisk.READ),
          Map.entry("getDailyFailureSummary", ToolRisk.READ),
          Map.entry("replayMessage", ToolRisk.WRITE),
          Map.entry("refundPayment", ToolRisk.WRITE));

  private static final Set<String> WRITE_TOOLS =
      TOOL_RISKS.entrySet().stream()
          .filter(e -> e.getValue() == ToolRisk.WRITE)
          .map(Map.Entry::getKey)
          .collect(java.util.stream.Collectors.toUnmodifiableSet());

  public void authorize(UserContext user, String toolName) {
    ToolRisk risk = TOOL_RISKS.getOrDefault(toolName, ToolRisk.WRITE);
    if (risk == ToolRisk.READ) {
      return;
    }
    if (user.role() == Role.SUPPORT) {
      throw new UnauthorizedToolException(
          "Role SUPPORT cannot invoke write tool: " + toolName);
    }
  }

  public ToolRisk riskOf(String toolName) {
    return TOOL_RISKS.getOrDefault(toolName, ToolRisk.WRITE);
  }

  public boolean isWriteTool(String toolName) {
    return WRITE_TOOLS.contains(toolName);
  }

  public Set<String> allowedToolsFor(UserContext user) {
    if (user.role() == Role.SUPPORT) {
      return TOOL_RISKS.entrySet().stream()
          .filter(e -> e.getValue() == ToolRisk.READ)
          .map(Map.Entry::getKey)
          .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }
    return TOOL_RISKS.keySet();
  }
}
