package com.vibhu.payment.config;

import io.camunda.zeebe.spring.client.annotation.Deployment;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

/** Deploys BPMN when connected to Zeebe. */
@Configuration
@ConditionalOnProperty(name = "payment.orchestration-mode", havingValue = "zeebe")
@Deployment(resources = "classpath*:/processes/*.bpmn")
public class CamundaConfiguration {}
