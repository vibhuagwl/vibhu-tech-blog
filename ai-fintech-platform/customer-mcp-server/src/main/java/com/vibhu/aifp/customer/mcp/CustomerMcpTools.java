package com.vibhu.aifp.customer.mcp;

import com.vibhu.aifp.common.CustomerRecord;
import com.vibhu.aifp.common.TransactionRecord;
import com.vibhu.aifp.domain.CustomerService;
import java.util.List;
import java.util.Map;
import org.springaicommunity.mcp.annotation.McpResource;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

@Component
public class CustomerMcpTools {

  private final CustomerService customerService;

  public CustomerMcpTools(CustomerService customerService) {
    this.customerService = customerService;
  }

  @McpTool(name = "getCustomer", description = "Get customer profile")
  public CustomerRecord getCustomer(
      @McpToolParam(description = "Customer id", required = true) String customerId) {
    return customerService.getCustomer(customerId);
  }

  @McpTool(name = "getCustomerTransactions", description = "List customer transactions")
  public List<TransactionRecord> getCustomerTransactions(
      @McpToolParam(description = "Customer id", required = true) String customerId) {
    return customerService.getCustomerTransactions(customerId);
  }

  @McpTool(name = "getCustomerRisk", description = "Customer risk tier")
  public Map<String, String> getCustomerRisk(
      @McpToolParam(description = "Customer id", required = true) String customerId) {
    return customerService.getCustomerRisk(customerId);
  }

  @McpResource(
      uri = "customer://risk/policy",
      name = "customer-risk-policy",
      description = "Risk tier definitions")
  public String riskPolicy() {
    return "LOW/MEDIUM/HIGH tiers drive refund and retry approval thresholds.";
  }
}
