package com.vibhu.msp.common;

import com.vibhu.msp.common.filter.CorrelationIdFilter;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

@AutoConfiguration
@ComponentScan(basePackageClasses = CorrelationIdFilter.class)
public class MspCommonAutoConfiguration {}
