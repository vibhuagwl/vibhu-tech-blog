package com.vibhu.sapi.orchestrator.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({HarnessProperties.class, SkillProperties.class})
public class HarnessConfig {}
