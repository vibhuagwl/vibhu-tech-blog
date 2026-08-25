package com.vibhu.aifp.payment.mcp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.vibhu.aifp")
public class PaymentMcpServerApplication {
  public static void main(String[] args) {
    SpringApplication.run(PaymentMcpServerApplication.class, args);
  }
}
