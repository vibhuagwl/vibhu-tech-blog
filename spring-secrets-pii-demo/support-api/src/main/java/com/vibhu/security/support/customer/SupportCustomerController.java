package com.vibhu.security.support.customer;

import com.vibhu.security.pii.common.dto.CreateCustomerRequest;
import com.vibhu.security.pii.common.dto.CustomerView;
import jakarta.servlet.http.HttpServletRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Public edge API — support agents call this, never customer-service directly. */
@RestController
@RequestMapping("/api/customers")
public class SupportCustomerController {

  private final SupportCustomerService supportCustomerService;

  public SupportCustomerController(SupportCustomerService supportCustomerService) {
    this.supportCustomerService = supportCustomerService;
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('SUPPORT','PII_ADMIN')")
  public ResponseEntity<CustomerView> create(@Valid @RequestBody CreateCustomerRequest request) {
    CustomerView created = supportCustomerService.create(request);
    return ResponseEntity.created(URI.create("/api/customers/" + created.id())).body(created);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('SUPPORT','PII_ADMIN')")
  public CustomerView get(
      @PathVariable UUID id,
      @RequestParam(defaultValue = "false") boolean fullPii,
      HttpServletRequest request) {
    return supportCustomerService.get(id, fullPii, request);
  }

  @ExceptionHandler(CustomerNotFoundException.class)
  ResponseEntity<Map<String, String>> notFound(CustomerNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
  }

  @ExceptionHandler(PiiAccessDeniedException.class)
  ResponseEntity<Map<String, String>> piiDenied(PiiAccessDeniedException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
  }
}
