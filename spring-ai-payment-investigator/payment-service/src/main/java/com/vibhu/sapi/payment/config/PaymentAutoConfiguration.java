package com.vibhu.sapi.payment.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@ComponentScan(basePackages = "com.vibhu.sapi.payment")
@EntityScan(basePackages = "com.vibhu.sapi.payment.entity")
@EnableJpaRepositories(basePackages = "com.vibhu.sapi.payment.repo")
public class PaymentAutoConfiguration {}
