package com.vibhu.sapi.mcp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {"com.vibhu.sapi.mcp", "com.vibhu.sapi.payment"})
@EntityScan(basePackages = "com.vibhu.sapi.payment.entity")
@EnableJpaRepositories(basePackages = "com.vibhu.sapi.payment.repo")
public class PaymentMcpServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaymentMcpServerApplication.class, args);
    }
}
