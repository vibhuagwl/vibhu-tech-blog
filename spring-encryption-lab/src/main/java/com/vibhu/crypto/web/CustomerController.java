package com.vibhu.crypto.web;

import com.vibhu.crypto.dto.CustomerCreateRequest;
import com.vibhu.crypto.dto.CustomerResponse;
import com.vibhu.crypto.entity.Customer;
import com.vibhu.crypto.service.CustomerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

  private final CustomerService customers;

  public CustomerController(CustomerService customers) {
    this.customers = customers;
  }

  @PostMapping
  public ResponseEntity<CustomerResponse> create(
      @Valid @RequestBody CustomerCreateRequest request) {
    Customer c = customers.create(request.name(), request.accountNumber(), request.pan());
    return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(c));
  }

  /**
   * Search via HMAC lookup column — equality on AES-GCM ciphertext would fail. Never log the
   * account number or PAN.
   */
  @GetMapping("/by-account")
  public ResponseEntity<?> findByAccount(@RequestParam @NotBlank String accountNumber) {
    return customers
        .findByAccountNumber(accountNumber)
        .map(c -> ResponseEntity.ok(toResponse(c)))
        .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
  }

  private static CustomerResponse toResponse(Customer c) {
    String pan = c.getPan();
    String masked =
        pan == null || pan.length() < 4 ? "****" : "****" + pan.substring(pan.length() - 4);
    return new CustomerResponse(c.getId(), c.getName(), c.getAccountNumber(), masked);
  }
}
