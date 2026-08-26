package com.vibhu.sapi;

import static org.assertj.core.api.Assertions.assertThat;

import com.vibhu.sapi.dto.ChatRequest;
import com.vibhu.sapi.dto.InvestigationContext;
import com.vibhu.sapi.gateway.ToolAuthorizationService;
import com.vibhu.sapi.orchestrator.PaymentInvestigatorApplication;
import com.vibhu.sapi.orchestrator.context.ContextEngineeringService;
import com.vibhu.sapi.security.UserContext;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = PaymentInvestigatorApplication.class)
class ContextEngineeringTest {

  @Autowired ContextEngineeringService contextEngineeringService;
  @Autowired ToolAuthorizationService toolAuthorizationService;

  @Test
  void buildsPrioritizedBudgetedContext() {
    ChatRequest request =
        new ChatRequest("conv-ctx", "Why did payment TXN-1001 fail with BEN-001?");
    Set<String> allowed = toolAuthorizationService.allowedToolsFor(UserContext.support("s1"));
    InvestigationContext context =
        contextEngineeringService.build(request, UserContext.support("s1"), allowed);

    assertThat(context.paymentId()).isEqualTo("TXN-1001");
    assertThat(context.items()).isNotEmpty();
    assertThat(context.items().getFirst().sourceType()).isEqualTo("security");
    assertThat(context.usedChars()).isLessThanOrEqualTo(context.budgetChars());
    assertThat(context.allowedTools()).contains("getPayment");
  }
}
