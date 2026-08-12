package com.vibhu.security.audit;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "DB_PASSWORD=audit-db-pass",
        "SERVICE_CLIENT_PASSWORD=service-secret",
        "COMPLIANCE_PASSWORD=compliance-secret"
})
class AuditServiceTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void recordAndQueryAuditTrail() throws Exception {
        UUID customerId = UUID.randomUUID();

        mockMvc.perform(post("/internal/audit/pii-access")
                        .with(httpBasic("support-api", "service-secret"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "at":"2026-08-12T10:00:00Z",
                                  "actor":"support",
                                  "sourceService":"support-api",
                                  "action":"READ_CUSTOMER",
                                  "customerId":"%s",
                                  "fullPiiGranted":false,
                                  "clientIp":"10.0.0.5"
                                }
                                """.formatted(customerId)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/internal/audit/customers/" + customerId)
                        .with(httpBasic("compliance", "compliance-secret")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].actor").value("support"))
                .andExpect(jsonPath("$[0].fullPiiGranted").value(false));
    }
}
