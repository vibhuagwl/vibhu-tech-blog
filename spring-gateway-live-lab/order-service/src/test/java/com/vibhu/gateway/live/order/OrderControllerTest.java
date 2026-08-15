package com.vibhu.gateway.live.order;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    properties = {
      "eureka.client.enabled=false",
      "eureka.client.register-with-eureka=false",
      "eureka.client.fetch-registry=false"
    })
@AutoConfigureMockMvc
class OrderControllerTest {

  @Autowired MockMvc mvc;

  @Test
  void getOrder() throws Exception {
    mvc.perform(get("/orders/5001"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.service").value("order-service"))
        .andExpect(jsonPath("$.id").value(5001));
  }
}
