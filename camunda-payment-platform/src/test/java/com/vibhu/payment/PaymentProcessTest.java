package com.vibhu.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class PaymentProcessTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;

  @Test
  void happyPathCompletesInMemory() throws Exception {
    String paymentId = "PAY-" + UUID.randomUUID().toString().substring(0, 8);
    mvc.perform(
            post("/api/payments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"paymentId":"%s","customerId":"CUST-100","amount":5000,"currency":"INR"}
                    """
                        .formatted(paymentId)))
        .andExpect(status().isAccepted())
        .andExpect(jsonPath("$.status").value("COMPLETED"))
        .andExpect(jsonPath("$.processInstanceId").isNotEmpty());

    mvc.perform(get("/api/payments/" + paymentId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("COMPLETED"))
        .andExpect(jsonPath("$.bankReference").isNotEmpty());
  }

  @Test
  void fraudCustomerIsRejected() throws Exception {
    String paymentId = "PAY-FRAUD-" + UUID.randomUUID().toString().substring(0, 6);
    mvc.perform(
            post("/api/payments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"paymentId":"%s","customerId":"CUST-FRAUD","amount":100,"currency":"USD"}
                    """
                        .formatted(paymentId)))
        .andExpect(status().isAccepted())
        .andExpect(jsonPath("$.status").value("FRAUD_REJECTED"));
  }

  @Test
  void highValueWaitsForApprovalThenCompletes() throws Exception {
    String paymentId = "PAY-HV-" + UUID.randomUUID().toString().substring(0, 6);
    mvc.perform(
            post("/api/payments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"paymentId":"%s","customerId":"CUST-VIP","amount":150000,"currency":"INR"}
                    """
                        .formatted(paymentId)))
        .andExpect(status().isAccepted())
        .andExpect(jsonPath("$.status").value("AWAITING_APPROVAL"));

    mvc.perform(post("/api/payments/" + paymentId + "/approvals").param("approved", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("COMPLETED"));
  }

  @Test
  void highValueRejectionEndsProcess() throws Exception {
    String paymentId = "PAY-REJ-" + UUID.randomUUID().toString().substring(0, 6);
    mvc.perform(
            post("/api/payments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"paymentId":"%s","customerId":"CUST-VIP","amount":200000,"currency":"INR"}
                    """
                        .formatted(paymentId)))
        .andExpect(status().isAccepted());

    mvc.perform(post("/api/payments/" + paymentId + "/approvals").param("approved", "false"))
        .andExpect(jsonPath("$.status").value("REJECTED"));
  }

  @Test
  void bankDeclineGoesToManualReview() throws Exception {
    String paymentId = "PAY-DEC-" + UUID.randomUUID().toString().substring(0, 6);
    MvcResult result =
        mvc.perform(
                post("/api/payments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"paymentId":"%s","customerId":"CUST-DECLINE","amount":50,"currency":"USD"}
                        """
                            .formatted(paymentId)))
            .andExpect(status().isAccepted())
            .andReturn();
    Map<?, ?> body = mapper.readValue(result.getResponse().getContentAsString(), Map.class);
    assertThat(body.get("status")).isEqualTo("MANUAL_REVIEW");
  }

  @Test
  void duplicatePaymentIdRejected() throws Exception {
    String paymentId = "PAY-DUP-" + UUID.randomUUID().toString().substring(0, 6);
    String json =
        """
        {"paymentId":"%s","customerId":"CUST-100","amount":10,"currency":"INR"}
        """
            .formatted(paymentId);
    mvc.perform(post("/api/payments").contentType(MediaType.APPLICATION_JSON).content(json))
        .andExpect(status().isAccepted());
    mvc.perform(post("/api/payments").contentType(MediaType.APPLICATION_JSON).content(json))
        .andExpect(status().isBadRequest());
  }
}
