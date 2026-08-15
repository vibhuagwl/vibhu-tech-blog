package com.vibhu.security.idanywhere.api;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    properties = {
      "spring.security.oauth2.resourceserver.jwt.issuer-uri=",
      "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=https://idp.test/jwks"
    })
@AutoConfigureMockMvc
class ResourceApiSecurityTest {

  @Autowired MockMvc mockMvc;

  @MockBean JwtDecoder jwtDecoder;

  @Test
  void unauthenticated_401() throws Exception {
    mockMvc.perform(get("/api/payments")).andExpect(status().isUnauthorized());
  }

  @Test
  void userGroup_canReadPayments() throws Exception {
    mockMvc
        .perform(
            get("/api/payments")
                .with(
                    jwt()
                        .jwt(
                            j ->
                                j.claim("upn", "alice@corp.example")
                                    .claim("groups", List.of("App.Payments.Users"))
                                    .audience(List.of("api://payments-api")))
                        .authorities(new SimpleGrantedAuthority("ROLE_USER"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].owner").value("alice@corp.example"));
  }

  @Test
  void userGroup_cannotReadAdmin() throws Exception {
    mockMvc
        .perform(
            get("/api/admin/stats")
                .with(
                    jwt()
                        .jwt(j -> j.claim("groups", List.of("App.Payments.Users")))
                        .authorities(new SimpleGrantedAuthority("ROLE_USER"))))
        .andExpect(status().isForbidden());
  }

  @Test
  void adminGroup_canReadAdmin() throws Exception {
    mockMvc
        .perform(
            get("/api/admin/stats")
                .with(
                    jwt()
                        .jwt(
                            j ->
                                j.claim(
                                    "groups", List.of("App.Payments.Users", "App.Payments.Admins")))
                        .authorities(
                            new SimpleGrantedAuthority("ROLE_USER"),
                            new SimpleGrantedAuthority("ROLE_ADMIN"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.source").value("idanywhere-groups"));
  }
}
