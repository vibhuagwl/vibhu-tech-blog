package com.vibhu.gateway.live.payment;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(
    properties = {
      "eureka.client.enabled=false",
      "eureka.client.register-with-eureka=false",
      "eureka.client.fetch-registry=false"
    })
@AutoConfigureMockMvc
class PaymentControllerTest {

  @Autowired MockMvc mvc;

  @Test
  void settlesOnceAndIdempotentRetryReturnsSamePayment() throws Exception {
    String body =
        """
        {"fromAccountId":1001,"toAccountId":1002,"amount":10.00}
        """;

    MvcResult first =
        mvc.perform(
                post("/payments")
                    .header("Idempotency-Key", "idem-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("SETTLED"))
            .andReturn();

    String paymentId =
        com.jayway.jsonpath.JsonPath.read(first.getResponse().getContentAsString(), "$.paymentId");

    mvc.perform(
            post("/payments")
                .header("Idempotency-Key", "idem-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paymentId").value(paymentId))
        .andExpect(jsonPath("$.status").value("SETTLED"));

    mvc.perform(get("/payments/" + paymentId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("SETTLED"));
  }

  @Test
  void insufficientFundsIsRejectedNotSettled() throws Exception {
    mvc.perform(
            post("/payments")
                .header("Idempotency-Key", "idem-nsf")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"fromAccountId":1001,"toAccountId":1002,"amount":999999.00}
                    """))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.status").value("REJECTED"));
  }

  @Test
  void requiresIdempotencyKey() throws Exception {
    mvc.perform(
            post("/payments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"fromAccountId":1001,"toAccountId":1002,"amount":1.00}
                    """))
        .andExpect(status().isBadRequest());
  }
}
