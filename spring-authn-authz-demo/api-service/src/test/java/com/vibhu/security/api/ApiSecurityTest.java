package com.vibhu.security.api;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ApiSecurityTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void unauthenticatedGets401() throws Exception {
        mockMvc.perform(get("/api/accounts/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void aliceCanReadAccounts() throws Exception {
        mockMvc.perform(get("/api/accounts/me").with(httpBasic("alice", "password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void aliceCannotReadAdminStats() throws Exception {
        mockMvc.perform(get("/api/admin/stats").with(httpBasic("alice", "password")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanReadAdminStats() throws Exception {
        mockMvc.perform(get("/api/admin/stats").with(httpBasic("admin", "password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }
}
