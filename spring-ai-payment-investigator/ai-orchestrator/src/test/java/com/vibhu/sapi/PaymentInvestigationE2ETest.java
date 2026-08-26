package com.vibhu.sapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.sapi.dto.ChatRequest;
import com.vibhu.sapi.dto.ChatResponse;
import com.vibhu.sapi.dto.PaymentInvestigation;
import com.vibhu.sapi.gateway.audit.ToolAuditService;
import com.vibhu.sapi.orchestrator.PaymentInvestigatorApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(classes = PaymentInvestigatorApplication.class)
@AutoConfigureMockMvc
class PaymentInvestigationE2ETest {

  @Autowired MockMvc mockMvc;
  @Autowired ObjectMapper objectMapper;
  @Autowired ToolAuditService toolAuditService;

  @Test
  void investigatesTxn1001WithEvidence() throws Exception {
    long before = toolAuditService.count();
    ChatRequest request =
        new ChatRequest("conv-e2e", "Why did payment TXN-1001 fail?");

    String body =
        mockMvc
            .perform(
                post("/api/ai/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer demo")
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    ChatResponse response = objectMapper.readValue(body, ChatResponse.class);
    assertThat(response.result()).isNotNull();

    PaymentInvestigation inv =
        objectMapper.convertValue(response.result(), PaymentInvestigation.class);
    assertThat(inv.paymentId()).isEqualTo("TXN-1001");
    assertThat(inv.status()).isEqualTo("FAILED");
    assertThat(inv.rootCause()).containsIgnoringCase("BEN-001");
    assertThat(inv.evidence()).isNotEmpty();
    assertThat(inv.evidence().stream().anyMatch(e -> e.summary().contains("BEN-001"))).isTrue();
    assertThat(inv.rootCause()).contains("3");

    assertThat(toolAuditService.count()).isGreaterThan(before);
    assertThat(toolAuditService.all().stream().map(a -> a.toolName()))
        .doesNotContain("payment.execute");
  }
}
