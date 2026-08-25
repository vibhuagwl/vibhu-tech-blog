package com.vibhu.aifp.customer.mcp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.vibhu.aifp")
public class CustomerMcpServerApplication {
  public static void main(String[] args) {
    SpringApplication.run(CustomerMcpServerApplication.class, args);
  }
}
