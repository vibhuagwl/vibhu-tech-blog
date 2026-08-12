package com.vibhu.security.pii;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "PII_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "DB_PASSWORD=test-db-pass",
        "API_BASIC_PASSWORD=support-secret",
        "PII_ADMIN_PASSWORD=pii-admin-secret"
})
class CustomerPiiSecurityTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void createAndReadMaskedPii() throws Exception {
        MvcResult create = mockMvc.perform(post("/api/customers")
                        .with(httpBasic("support", "support-secret"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Jane Doe","email":"jane.doe@bank.com","ssn":"123-45-6789","panLast4":"4242"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.masked").value(true))
                .andExpect(jsonPath("$.email").value("j***@bank.com"))
                .andReturn();

        String body = create.getResponse().getContentAsString();
        String id = body.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/customers/" + id)
                        .with(httpBasic("support", "support-secret")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ssn").value("***-**-6789"));
    }

    @Test
    void fullPiiRequiresAdminRole() throws Exception {
        MvcResult create = mockMvc.perform(post("/api/customers")
                        .with(httpBasic("support", "support-secret"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Bob","email":"bob@bank.com","ssn":"987-65-4321","panLast4":"1111"}
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        String id = create.getResponse().getContentAsString()
                .replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/customers/" + id)
                        .param("fullPii", "true")
                        .with(httpBasic("support", "support-secret")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/customers/" + id)
                        .param("fullPii", "true")
                        .with(httpBasic("piiadmin", "pii-admin-secret")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.masked").value(false))
                .andExpect(jsonPath("$.email").value("bob@bank.com"));
    }
}
