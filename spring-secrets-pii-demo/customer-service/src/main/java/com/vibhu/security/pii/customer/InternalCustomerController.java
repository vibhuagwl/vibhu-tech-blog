package com.vibhu.security.pii.customer;

import com.vibhu.security.pii.common.dto.CreateCustomerRequest;
import com.vibhu.security.pii.common.dto.CustomerRecord;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Internal PII vault API — not exposed to agents or the public internet. */
@RestController
@RequestMapping("/internal/customers")
public class InternalCustomerController {

  private final CustomerService customerService;

  public InternalCustomerController(CustomerService customerService) {
    this.customerService = customerService;
  }

  @PostMapping
  @PreAuthorize("hasRole('SERVICE')")
  public ResponseEntity<CustomerRecord> create(@Valid @RequestBody CreateCustomerRequest request) {
    CustomerRecord created = customerService.create(request);
    return ResponseEntity.created(URI.create("/internal/customers/" + created.id())).body(created);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasRole('SERVICE')")
  public CustomerRecord get(@PathVariable UUID id) {
    return customerService.get(id);
  }

  @ExceptionHandler(CustomerNotFoundException.class)
  ResponseEntity<Map<String, String>> notFound(CustomerNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
  }
}
