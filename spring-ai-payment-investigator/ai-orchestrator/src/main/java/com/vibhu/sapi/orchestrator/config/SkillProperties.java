package com.vibhu.sapi.orchestrator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.skills")
public record SkillProperties(@DefaultValue("true") boolean enabled,
                              @DefaultValue("classpath:skills/payment-investigation") String location,
                              @DefaultValue("true") boolean failOnMissing) {
}
