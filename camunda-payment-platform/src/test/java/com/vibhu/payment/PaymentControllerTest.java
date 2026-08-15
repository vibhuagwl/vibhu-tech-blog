package com.vibhu.payment;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class PaymentControllerTest {

  @Autowired MockMvc mvc;

  @Test
  void rejectsInvalidPayload() throws Exception {
    mvc.perform(
            post("/api/payments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"paymentId\":\"\",\"customerId\":\"\",\"amount\":-1,\"currency\":\"\"}"))
        .andExpect(status().isBadRequest());
  }
}
