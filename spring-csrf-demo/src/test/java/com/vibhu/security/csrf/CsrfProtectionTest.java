package com.vibhu.security.csrf;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class CsrfProtectionTest {

  @Autowired MockMvc mockMvc;

  @Test
  void transferWithoutCsrfIsForbidden() throws Exception {
    mockMvc
        .perform(
            post("/transfer")
                .with(user("alice").roles("USER"))
                .param("toAccount", "B")
                .param("amount", "100"))
        .andExpect(status().isForbidden());
  }

  @Test
  void transferWithCsrfSucceeds() throws Exception {
    mockMvc
        .perform(
            post("/transfer")
                .with(user("alice").roles("USER"))
                .with(csrf())
                .param("toAccount", "B")
                .param("amount", "100"))
        .andExpect(status().is3xxRedirection())
        .andExpect(redirectedUrl("/transfer"));
  }

  @Test
  void loginPageIsPublic() throws Exception {
    mockMvc.perform(get("/login")).andExpect(status().isOk());
  }

  @Test
  void spaTransferWithoutCsrfHeaderIsForbidden() throws Exception {
    mockMvc
        .perform(
            post("/spa/transfer")
                .with(httpBasic("alice", "password"))
                .param("toAccount", "C")
                .param("amount", "50"))
        .andExpect(status().isForbidden());
  }

  @Test
  void spaTransferWithCsrfSucceeds() throws Exception {
    mockMvc
        .perform(
            post("/spa/transfer")
                .with(httpBasic("alice", "password"))
                .with(csrf())
                .param("toAccount", "C")
                .param("amount", "50"))
        .andExpect(status().isOk());
  }
}
