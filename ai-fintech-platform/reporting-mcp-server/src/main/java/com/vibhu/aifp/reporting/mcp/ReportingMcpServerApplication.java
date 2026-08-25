package com.vibhu.aifp.reporting.mcp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.vibhu.aifp")
public class ReportingMcpServerApplication {
  public static void main(String[] args) {
    SpringApplication.run(ReportingMcpServerApplication.class, args);
  }
}
