package com.vibhu.gateway.live.user;

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
class UserControllerTest {

  @Autowired MockMvc mvc;

  @Test
  void getUser() throws Exception {
    mvc.perform(get("/users/101"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.service").value("user-service"))
        .andExpect(jsonPath("$.id").value(101))
        .andExpect(jsonPath("$.instance").value("user-1"))
        .andExpect(jsonPath("$.port").exists());
  }
}
