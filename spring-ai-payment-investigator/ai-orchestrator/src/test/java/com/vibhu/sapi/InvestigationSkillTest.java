package com.vibhu.sapi;

import static org.assertj.core.api.Assertions.assertThat;

import com.vibhu.sapi.orchestrator.PaymentInvestigatorApplication;
import com.vibhu.sapi.orchestrator.config.InvestigationSkillService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = PaymentInvestigatorApplication.class)
class InvestigationSkillTest {

  @Autowired InvestigationSkillService skillService;

  @Test
  void loadsSkillMarkdownAndToolDocs() {
    assertThat(skillService.toolDocCount()).isGreaterThanOrEqualTo(6);
    String prompt = skillService.systemPrompt();
    assertThat(prompt).contains("Never call payment.execute");
    assertThat(prompt).contains("getPayment");
    assertThat(prompt).contains("searchPaymentPolicy");
    assertThat(prompt).contains("createInvestigationCase");
    assertThat(prompt).contains("TXN-1001");
  }
}
