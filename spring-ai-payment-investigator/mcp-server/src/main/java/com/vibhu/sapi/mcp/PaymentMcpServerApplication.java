package com.vibhu.sapi.mcp;

import com.vibhu.sapi.payment.config.PaymentAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

@SpringBootApplication(scanBasePackages = "com.vibhu.sapi.mcp")
@Import(PaymentAutoConfiguration.class)
public class PaymentMcpServerApplication {

  public static void main(String[] args) {
    SpringApplication.run(PaymentMcpServerApplication.class, args);
  }
}
