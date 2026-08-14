package com.vibhu.multitenant.customer;

import com.vibhu.multitenant.exception.TenantExceptions;
import com.vibhu.multitenant.tenant.context.TenantContext;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {

  private final CustomerRepository customers;

  public CustomerService(CustomerRepository customers) {
    this.customers = customers;
  }

  @Transactional
  public CustomerEntity create(String name, String email) {
    CustomerEntity customer = new CustomerEntity();
    customer.setId(UUID.randomUUID());
    customer.setTenantId(TenantContext.requireTenantId());
    customer.setName(name);
    customer.setEmail(email);
    customer.setCreatedAt(Instant.now());
    return customers.save(customer);
  }

  @Transactional(readOnly = true)
  public CustomerEntity get(UUID id) {
    return customers
        .findByIdAndTenantId(id, TenantContext.requireTenantId())
        .orElseThrow(() -> TenantExceptions.notFound("customer"));
  }

  @Transactional(readOnly = true)
  public Page<CustomerEntity> list(Pageable pageable) {
    return customers.findAllByTenantId(TenantContext.requireTenantId(), pageable);
  }
}
