package com.vibhu.security.cors;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class CorsSecurityTest {

  private static final String ALLOWED = "http://localhost:5500";
  private static final String EVIL = "http://evil.example";

  @Autowired
  MockMvc mockMvc;

  @Test
  void allowedOriginReceivesAcao() throws Exception {
    mockMvc.perform(get("/api/public/ping").header("Origin", ALLOWED))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED))
        .andExpect(header().string("Access-Control-Allow-Credentials", "true"))
        .andExpect(jsonPath("$.status").value("ok"));
  }

  @Test
  void evilOriginIsRejectedByCorsFilter() throws Exception {
    // Spring Security CorsFilter rejects disallowed Origin with 403 Invalid CORS request
    // (browser would also block; server-side rejection is stricter and fine for APIs)
    mockMvc.perform(get("/api/public/ping").header("Origin", EVIL))
        .andExpect(status().isForbidden())
        .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
  }

  @Test
  void preflightForCredentialedPostSucceeds() throws Exception {
    mockMvc.perform(options("/api/transfers")
            .header("Origin", ALLOWED)
            .header("Access-Control-Request-Method", "POST")
            .header("Access-Control-Request-Headers", "authorization,content-type"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED))
        .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
  }

  @Test
  void authenticatedApiWorksWithAllowedOrigin() throws Exception {
    mockMvc.perform(get("/api/accounts/me")
            .with(httpBasic("alice", "password"))
            .header("Origin", ALLOWED))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED))
        .andExpect(header().exists("X-Request-Id"))
        .andExpect(jsonPath("$.username").value("alice"));
  }

  @Test
  void transferPostWithAllowedOrigin() throws Exception {
    mockMvc.perform(post("/api/transfers")
            .with(httpBasic("alice", "password"))
            .header("Origin", ALLOWED)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"toAccount\":\"B\",\"amount\":100}"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED))
        .andExpect(jsonPath("$.status").value("ACCEPTED"));
  }
}
