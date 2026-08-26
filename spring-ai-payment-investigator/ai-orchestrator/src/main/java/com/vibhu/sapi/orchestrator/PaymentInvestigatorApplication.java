package com.vibhu.sapi.orchestrator;

import com.vibhu.sapi.payment.config.PaymentAutoConfiguration;
import com.vibhu.sapi.rag.RagAutoConfiguration;
import com.vibhu.sapi.gateway.ToolGatewayAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

@SpringBootApplication(scanBasePackages = "com.vibhu.sapi")
@Import({PaymentAutoConfiguration.class, RagAutoConfiguration.class, ToolGatewayAutoConfiguration.class})
public class PaymentInvestigatorApplication {

  public static void main(String[] args) {
    SpringApplication.run(PaymentInvestigatorApplication.class, args);
  }
}
