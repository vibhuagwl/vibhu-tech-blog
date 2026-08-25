package com.example.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class PaymentOpsApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaymentOpsApplication.class, args);
    }
}
