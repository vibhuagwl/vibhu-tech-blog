package com.vibhu.sapi;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vibhu.sapi.exception.UnauthorizedToolException;
import com.vibhu.sapi.gateway.ToolAuthorizationService;
import com.vibhu.sapi.orchestrator.PaymentInvestigatorApplication;
import com.vibhu.sapi.security.UserContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = PaymentInvestigatorApplication.class)
class ToolAuthorizationTest {

  @Autowired ToolAuthorizationService authorizationService;

  @Test
  void deniesPaymentExecuteForSupport() {
    assertThatThrownBy(() -> authorizationService.authorize(UserContext.support("s1"), "payment.execute"))
        .isInstanceOf(UnauthorizedToolException.class);
  }

  @Test
  void allowsReadToolsForSupport() {
    authorizationService.authorize(UserContext.support("s1"), "getPayment");
  }
}
