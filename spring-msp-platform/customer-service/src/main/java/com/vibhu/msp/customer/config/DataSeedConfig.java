package com.vibhu.msp.customer.config;

import com.vibhu.msp.customer.entity.CustomerEntity;
import com.vibhu.msp.customer.repository.CustomerRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeedConfig {

  @Bean
  CommandLineRunner seedCustomers(CustomerRepository customerRepository) {
    return args -> {
      if (!customerRepository.existsById("cust-1")) {
        CustomerEntity customer = new CustomerEntity();
        customer.setId("cust-1");
        customer.setName("Alice Checkout");
        customer.setEmail("alice@example.com");
        customer.setTier("GOLD");
        customerRepository.save(customer);
      }
    };
  }
}
