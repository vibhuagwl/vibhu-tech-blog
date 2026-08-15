package com.vibhu.msp.customer.controller;

import com.vibhu.msp.customer.cache.CustomerCacheService;
import com.vibhu.msp.customer.entity.CustomerEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

  private final CustomerCacheService customerCacheService;

  public CustomerController(CustomerCacheService customerCacheService) {
    this.customerCacheService = customerCacheService;
  }

  @GetMapping("/health")
  public ResponseEntity<String> health() {
    return ResponseEntity.ok("customer-service-ok");
  }

  @GetMapping("/{customerId}")
  public ResponseEntity<CustomerResponse> getCustomer(@PathVariable String customerId) {
    CustomerEntity customer = customerCacheService.getCustomer(customerId);
    return ResponseEntity.ok(new CustomerResponse(
        customer.getId(), customer.getName(), customer.getEmail(), customer.getTier()));
  }

  public record CustomerResponse(String id, String name, String email, String tier) {}
}
