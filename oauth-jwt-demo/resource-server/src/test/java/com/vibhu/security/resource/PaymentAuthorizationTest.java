package com.vibhu.security.resource;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityOverrides.class)
class PaymentAuthorizationTest {

  @Autowired MockMvc mockMvc;

  @Test
  void missingToken_returns401() throws Exception {
    mockMvc
        .perform(get("/api/payments"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }

  @Test
  void readScope_canListPayments() throws Exception {
    mockMvc
        .perform(
            get("/api/payments")
                .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_payment.read"))))
        .andExpect(status().isOk());
  }

  @Test
  void readScope_cannotCreatePayment() throws Exception {
    mockMvc
        .perform(
            post("/api/payments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {"fromAccount":"A1","toAccount":"A2","amount":10.00,"currency":"USD"}
                                """)
                .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_payment.read"))))
        .andExpect(status().isForbidden());
  }

  @Test
  void writeScope_canCreatePayment() throws Exception {
    mockMvc
        .perform(
            post("/api/payments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {"fromAccount":"A1","toAccount":"A2","amount":10.00,"currency":"USD"}
                                """)
                .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_payment.write"))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.status").value("CREATED"));
  }

  @Test
  void adminDelete_requiresWriteAndAdmin() throws Exception {
    mockMvc
        .perform(
            delete("/api/payments/00000000-0000-0000-0000-000000000001")
                .with(
                    jwt()
                        .authorities(
                            new SimpleGrantedAuthority("SCOPE_payment.write"),
                            new SimpleGrantedAuthority("ROLE_ADMIN"))))
        .andExpect(status().isNotFound()); // authorized but resource missing
  }

  @Test
  void userCannotAccessAdminReports() throws Exception {
    mockMvc
        .perform(
            get("/api/admin/reports")
                .with(
                    jwt()
                        .authorities(
                            new SimpleGrantedAuthority("SCOPE_report.read"),
                            new SimpleGrantedAuthority("ROLE_USER"))))
        .andExpect(status().isForbidden());
  }
}
