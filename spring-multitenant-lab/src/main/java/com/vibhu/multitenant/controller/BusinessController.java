package com.vibhu.multitenant.controller;

import com.vibhu.multitenant.common.OrderStatus;
import com.vibhu.multitenant.customer.CustomerEntity;
import com.vibhu.multitenant.customer.CustomerService;
import com.vibhu.multitenant.order.OrderEntity;
import com.vibhu.multitenant.order.OrderService;
import com.vibhu.multitenant.payment.PaymentEntity;
import com.vibhu.multitenant.payment.PaymentService;
import com.vibhu.multitenant.tenant.TenantConfigurationEntity;
import com.vibhu.multitenant.tenant.service.TenantConfigService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class BusinessController {

  private final OrderService orders;
  private final CustomerService customers;
  private final PaymentService payments;
  private final TenantConfigService configs;

  public BusinessController(
      OrderService orders,
      CustomerService customers,
      PaymentService payments,
      TenantConfigService configs) {
    this.orders = orders;
    this.customers = customers;
    this.payments = payments;
    this.configs = configs;
  }

  public record CustomerRequest(@NotBlank String name, String email) {}

  public record CustomerResponse(UUID id, String name, String email, Instant createdAt) {}

  public record OrderRequest(@NotNull UUID customerId, @NotNull @DecimalMin("0.01") BigDecimal amount) {}

  public record OrderResponse(
      UUID id, UUID customerId, BigDecimal amount, String currency, OrderStatus status, Instant createdAt) {}

  public record ConfigUpdateRequest(
      String currency, String timezone, String locale, Integer rateLimitPerMinute, Integer maxUsers) {}

  @PostMapping("/customers")
  public CustomerResponse createCustomer(@Valid @RequestBody CustomerRequest request) {
    CustomerEntity c = customers.create(request.name(), request.email());
    return new CustomerResponse(c.getId(), c.getName(), c.getEmail(), c.getCreatedAt());
  }

  @GetMapping("/customers")
  public Page<CustomerResponse> listCustomers(Pageable pageable) {
    return customers
        .list(pageable)
        .map(c -> new CustomerResponse(c.getId(), c.getName(), c.getEmail(), c.getCreatedAt()));
  }

  @GetMapping("/customers/{id}")
  public CustomerResponse getCustomer(@PathVariable UUID id) {
    CustomerEntity c = customers.get(id);
    return new CustomerResponse(c.getId(), c.getName(), c.getEmail(), c.getCreatedAt());
  }

  @PostMapping("/orders")
  public OrderResponse createOrder(@Valid @RequestBody OrderRequest request) {
    OrderEntity o = orders.create(request.customerId(), request.amount());
    return toOrder(o);
  }

  @GetMapping("/orders")
  public Page<OrderResponse> listOrders(Pageable pageable) {
    return orders.list(pageable).map(this::toOrder);
  }

  @GetMapping("/orders/{id}")
  public OrderResponse getOrder(@PathVariable UUID id) {
    return toOrder(orders.get(id));
  }

  @PutMapping("/orders/{id}/cancel")
  public OrderResponse cancel(@PathVariable UUID id) {
    return toOrder(orders.cancel(id));
  }

  @PostMapping("/orders/{id}/pay")
  public PaymentEntity pay(@PathVariable UUID id) {
    return payments.pay(id);
  }

  @GetMapping("/orders/{id}/payments")
  public List<PaymentEntity> payments(@PathVariable UUID id) {
    return payments.forOrder(id);
  }

  @GetMapping("/tenant/config")
  public TenantConfigurationEntity getConfig() {
    return configs.getCurrent();
  }

  @PutMapping("/tenant/config")
  @PreAuthorize("hasRole('ADMIN')")
  public TenantConfigurationEntity updateConfig(@RequestBody ConfigUpdateRequest request) {
    return configs.update(
        request.currency(),
        request.timezone(),
        request.locale(),
        request.rateLimitPerMinute(),
        request.maxUsers());
  }

  private OrderResponse toOrder(OrderEntity o) {
    return new OrderResponse(
        o.getId(), o.getCustomerId(), o.getAmount(), o.getCurrency(), o.getStatus(), o.getCreatedAt());
  }
}
