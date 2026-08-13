package com.vibhu.crypto.service;

import com.vibhu.crypto.crypto.HmacService;
import com.vibhu.crypto.entity.Customer;
import com.vibhu.crypto.repository.CustomerRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {
  private final CustomerRepository customers;
  private final HmacService hmac;

  public CustomerService(CustomerRepository customers, HmacService hmac) {
    this.customers = customers;
    this.hmac = hmac;
  }

  @Transactional
  public Customer create(String name, String accountNumber, String pan) {
    Customer c = new Customer();
    c.setName(name);
    c.setAccountNumber(accountNumber);
    c.setAccountNumberLookup(hmac.lookupDigest(normalize(accountNumber)));
    c.setPan(pan);
    return customers.save(c);
  }

  @Transactional(readOnly = true)
  public Optional<Customer> findByAccountNumber(String accountNumber) {
    return customers.findByAccountNumberLookup(hmac.lookupDigest(normalize(accountNumber)));
  }

  static String normalize(String accountNumber) {
    return accountNumber == null ? "" : accountNumber.replaceAll("\\s", "");
  }
}
