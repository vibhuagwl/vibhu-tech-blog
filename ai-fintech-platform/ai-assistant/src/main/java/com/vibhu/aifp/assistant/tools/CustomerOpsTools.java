package com.vibhu.aifp.assistant.tools;

import com.vibhu.aifp.assistant.security.UserContextHolder;
import com.vibhu.aifp.common.CustomerRecord;
import com.vibhu.aifp.common.TransactionRecord;
import com.vibhu.aifp.domain.CustomerService;
import com.vibhu.aifp.domain.ToolAuthorizationService;
import java.util.List;
import java.util.Map;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class CustomerOpsTools {

  private final CustomerService customerService;
  private final ToolAuthorizationService authorizationService;

  public CustomerOpsTools(CustomerService customerService, ToolAuthorizationService authorizationService) {
    this.customerService = customerService;
    this.authorizationService = authorizationService;
  }

  @Tool(description = "Get customer profile. Read-only.")
  public CustomerRecord getCustomer(String customerId) {
    authorizationService.authorize(UserContextHolder.get(), "getCustomer");
    return customerService.getCustomer(customerId);
  }

  @Tool(description = "List customer transactions. Read-only.")
  public List<TransactionRecord> getCustomerTransactions(String customerId) {
    authorizationService.authorize(UserContextHolder.get(), "getCustomerTransactions");
    return customerService.getCustomerTransactions(customerId);
  }

  @Tool(description = "Customer risk tier. Read-only.")
  public Map<String, String> getCustomerRisk(String customerId) {
    authorizationService.authorize(UserContextHolder.get(), "getCustomerRisk");
    return customerService.getCustomerRisk(customerId);
  }
}
