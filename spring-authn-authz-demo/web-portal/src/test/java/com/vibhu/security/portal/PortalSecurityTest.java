package com.vibhu.security.portal;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
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
class PortalSecurityTest {

  @Autowired MockMvc mockMvc;

  @Test
  void homeIsPublic() throws Exception {
    mockMvc.perform(get("/")).andExpect(status().isOk());
  }

  @Test
  void paymentsRequiresAuth() throws Exception {
    mockMvc.perform(get("/payments")).andExpect(status().is3xxRedirection());
  }

  @Test
  void userCanAccessPayments() throws Exception {
    mockMvc.perform(get("/payments").with(user("alice").roles("USER"))).andExpect(status().isOk());
  }

  @Test
  void userCannotAccessAdmin() throws Exception {
    mockMvc
        .perform(get("/admin").with(user("alice").roles("USER")))
        .andExpect(status().isForbidden());
  }

  @Test
  void adminCanAccessAdmin() throws Exception {
    mockMvc
        .perform(get("/admin").with(user("admin").roles("ADMIN", "USER")))
        .andExpect(status().isOk());
  }

  @Test
  void createPaymentWithCsrf() throws Exception {
    mockMvc
        .perform(
            post("/payments")
                .param("amount", "10.00")
                .param("note", "test")
                .with(user("alice").roles("USER"))
                .with(csrf()))
        .andExpect(status().is3xxRedirection())
        .andExpect(redirectedUrl("/payments"));
  }
}
