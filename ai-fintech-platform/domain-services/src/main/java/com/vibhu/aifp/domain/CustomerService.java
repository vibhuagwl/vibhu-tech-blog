package com.vibhu.aifp.domain;

import com.vibhu.aifp.common.CustomerRecord;
import com.vibhu.aifp.common.TransactionRecord;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CustomerService {

  private final DomainDataSeeder seeder;

  public CustomerService(DomainDataSeeder seeder) {
    this.seeder = seeder;
  }

  public CustomerRecord getCustomer(String customerId) {
    CustomerRecord customer = seeder.customers().get(normalize(customerId));
    if (customer == null) {
      throw new IllegalArgumentException("Customer not found: " + customerId);
    }
    return customer;
  }

  public List<TransactionRecord> getCustomerTransactions(String customerId) {
    getCustomer(customerId);
    return seeder.customerTransactions().getOrDefault(normalize(customerId), List.of());
  }

  public Map<String, String> getCustomerRisk(String customerId) {
    CustomerRecord customer = getCustomer(customerId);
    return Map.of(
        "customerId", customer.customerId(),
        "riskTier", customer.riskTier(),
        "segment", customer.segment(),
        "notes", "MEDIUM risk SME with two recent payment events.");
  }

  private static String normalize(String id) {
    return id == null ? "" : id.trim().toUpperCase(Locale.ROOT);
  }
}
