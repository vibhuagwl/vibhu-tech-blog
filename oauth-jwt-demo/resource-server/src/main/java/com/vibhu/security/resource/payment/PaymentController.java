package com.vibhu.security.resource.payment;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

  private final PaymentService paymentService;

  public PaymentController(PaymentService paymentService) {
    this.paymentService = paymentService;
  }

  @GetMapping
  @PreAuthorize("hasAuthority('SCOPE_payment.read')")
  public List<Payment> list() {
    return paymentService.findAll();
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAuthority('SCOPE_payment.read')")
  public Payment get(@PathVariable UUID id) {
    return paymentService
        .findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAuthority('SCOPE_payment.write')")
  public Payment create(@Valid @RequestBody CreatePaymentRequest request) {
    return paymentService.create(request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("hasAuthority('SCOPE_payment.write') and hasRole('ADMIN')")
  public void delete(@PathVariable UUID id) {
    if (!paymentService.delete(id)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
  }
}
