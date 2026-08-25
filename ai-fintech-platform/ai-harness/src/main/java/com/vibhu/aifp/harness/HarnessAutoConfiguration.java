package com.vibhu.aifp.harness;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan(basePackageClasses = HarnessAutoConfiguration.class)
public class HarnessAutoConfiguration {}
