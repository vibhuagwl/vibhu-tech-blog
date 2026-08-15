package com.vibhu.msp.config;

import com.vibhu.msp.observability.TraceContextFilter;
import com.vibhu.msp.security.DemoJwtAuthFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class WebFilterConfig {

  @Bean
  FilterRegistrationBean<TraceContextFilter> traceContextFilter() {
    FilterRegistrationBean<TraceContextFilter> bean = new FilterRegistrationBean<>(new TraceContextFilter());
    bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
    return bean;
  }

  @Bean
  FilterRegistrationBean<DemoJwtAuthFilter> demoJwtAuthFilter() {
    FilterRegistrationBean<DemoJwtAuthFilter> bean = new FilterRegistrationBean<>(new DemoJwtAuthFilter());
    bean.setOrder(Ordered.HIGHEST_PRECEDENCE + 1);
    return bean;
  }
}
