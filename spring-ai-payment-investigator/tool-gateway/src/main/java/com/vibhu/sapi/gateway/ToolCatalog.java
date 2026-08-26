package com.vibhu.sapi.gateway;

import com.vibhu.sapi.enums.ToolRisk;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ToolCatalog {

  private static final Map<String, ToolDefinition> TOOLS =
      Map.ofEntries(
          Map.entry(
              "getPayment",
              new ToolDefinition(
                  "getPayment",
                  "Get payment details by TXN id",
                  "payment.read",
                  ToolRisk.READ,
                  false)),
          Map.entry(
              "getPaymentHistory",
              new ToolDefinition(
                  "getPaymentHistory",
                  "Get payment event timeline",
                  "payment.read",
                  ToolRisk.READ,
                  false)),
          Map.entry(
              "getBankResponse",
              new ToolDefinition(
                  "getBankResponse",
                  "Get bank response for payment",
                  "payment.read",
                  ToolRisk.READ,
                  false)),
          Map.entry(
              "getPaymentRetryHistory",
              new ToolDefinition(
                  "getPaymentRetryHistory",
                  "Get retry attempt history",
                  "payment.read",
                  ToolRisk.READ,
                  false)),
          Map.entry(
              "getCustomerPaymentProfile",
              new ToolDefinition(
                  "getCustomerPaymentProfile",
                  "Get customer payment profile",
                  "payment.read",
                  ToolRisk.READ,
                  false)),
          Map.entry(
              "getPaymentStatus",
              new ToolDefinition(
                  "getPaymentStatus",
                  "Get payment status",
                  "payment.read",
                  ToolRisk.READ,
                  false)),
          Map.entry(
              "searchPaymentPolicy",
              new ToolDefinition(
                  "searchPaymentPolicy",
                  "Search payment policy documents",
                  "policy.read",
                  ToolRisk.READ,
                  false)),
          Map.entry(
              "getRelatedKafkaEvents",
              new ToolDefinition(
                  "getRelatedKafkaEvents",
                  "Get Kafka events for payment",
                  "kafka.read",
                  ToolRisk.READ,
                  false)),
          Map.entry(
              "createInvestigationCase",
              new ToolDefinition(
                  "createInvestigationCase",
                  "Create investigation case for failed payment",
                  "investigation.create",
                  ToolRisk.WRITE,
                  true)),
          Map.entry(
              "payment.execute",
              new ToolDefinition(
                  "payment.execute",
                  "Execute or retry payment — HITL only",
                  "payment.execute",
                  ToolRisk.WRITE,
                  true)));

  public ToolDefinition get(String toolName) {
    return TOOLS.get(toolName);
  }

  public Set<String> allToolNames() {
    return TOOLS.keySet();
  }

  public List<ToolDefinition> all() {
    return List.copyOf(TOOLS.values());
  }

  public boolean isWriteTool(String toolName) {
    ToolDefinition def = TOOLS.get(toolName);
    return def != null && def.risk() == ToolRisk.WRITE;
  }
}
