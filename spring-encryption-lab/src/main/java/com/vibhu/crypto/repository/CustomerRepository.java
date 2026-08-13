package com.vibhu.crypto.repository;

import com.vibhu.crypto.entity.Customer;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
  Optional<Customer> findByAccountNumberLookup(String accountNumberLookup);
}
