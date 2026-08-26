package com.vibhu.sapi.orchestrator.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(HarnessProperties.class)
public class HarnessConfig {}
