package com.vibhu.ratelimit.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vibhu.ratelimit.RateLimitApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(classes = RateLimitApplication.class)
@AutoConfigureMockMvc
class RateLimitWebTest {

  @Autowired
  MockMvc mvc;

  @Test
  void paymentsWithinQuotaReturnAcceptedAndRateLimitHeaders() throws Exception {
    mvc.perform(post("/api/payments")
            .header("X-Tenant-Id", "acme")
            .header("X-Client-Id", "web-test-client")
            .header("X-User-Id", "u-web"))
        .andExpect(status().isOk())
        .andExpect(header().exists(RateLimitHeaders.LIMIT))
        .andExpect(header().exists(RateLimitHeaders.REMAINING));
  }

  @Test
  void listAndUpdatePoliciesWithoutRestart() throws Exception {
    mvc.perform(get("/api/rate-limits")).andExpect(status().isOk());
    mvc.perform(put("/api/rate-limits/user-minute")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "id": "user-minute",
                  "scope": "USER",
                  "capacity": 50,
                  "refillRate": 50,
                  "refillPeriod": "MINUTE"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.capacity").value(50));
  }

  @Test
  void createPolicyConflictWhenIdExists() throws Exception {
    mvc.perform(post("/api/rate-limits")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "id": "global-hour",
                  "scope": "GLOBAL",
                  "capacity": 1,
                  "refillRate": 1,
                  "refillPeriod": "HOUR"
                }
                """))
        .andExpect(status().isConflict());
  }
}
