package com.vibhu.fai;

import static org.assertj.core.api.Assertions.assertThat;

import com.vibhu.fai.audit.ToolAuditRepository;
import com.vibhu.fai.common.dto.ChatApiResponse;
import com.vibhu.fai.common.dto.ChatRequest;
import com.vibhu.fai.common.dto.PaymentInvestigation;
import com.vibhu.fai.common.security.AuthContext;
import com.vibhu.fai.orchestrator.FinancialAiOrchestrator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class PaymentInvestigationE2ETest {

  @Autowired FinancialAiOrchestrator orchestrator;
  @Autowired ToolAuditRepository audits;

  @Test
  void investigatesFailedPaymentWithEvidence() {
    long before = audits.count();
    ChatApiResponse response =
        orchestrator.chat(
            new ChatRequest("C100", "Why did payment TXN-1001 fail?", "TENANT-1", "user-demo"),
            AuthContext.demo());

    assertThat(response.result()).isInstanceOf(PaymentInvestigation.class);
    PaymentInvestigation inv = (PaymentInvestigation) response.result();
    assertThat(inv.transactionId()).isEqualTo("TXN-1001");
    assertThat(inv.status()).isEqualTo("FAILED");
    assertThat(inv.rootCause()).containsIgnoringCase("AC04");
    assertThat(inv.evidence()).isNotEmpty();
    assertThat(inv.evidence().stream().anyMatch(e -> e.contains("TXN-1001") || e.contains("POL-")))
        .isTrue();
    assertThat(audits.count()).isGreaterThan(before);
  }
}
