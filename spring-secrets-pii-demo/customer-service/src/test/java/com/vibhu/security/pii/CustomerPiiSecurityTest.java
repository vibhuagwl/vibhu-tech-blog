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
@TestPropertySource(
    properties = {
      "PII_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      "DB_PASSWORD=test-db-pass",
      "SERVICE_CLIENT_PASSWORD=service-secret"
    })
class CustomerPiiSecurityTest {

  @Autowired MockMvc mockMvc;

  @Test
  void internalCreateAndReadReturnsFullPiiToService() throws Exception {
    MvcResult create =
        mockMvc
            .perform(
                post("/internal/customers")
                    .with(httpBasic("support-api", "service-secret"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                                {"fullName":"Jane Doe","email":"jane.doe@bank.com","ssn":"123-45-6789","panLast4":"4242"}
                                """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("jane.doe@bank.com"))
            .andReturn();

    String id =
        create.getResponse().getContentAsString().replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

    mockMvc
        .perform(get("/internal/customers/" + id).with(httpBasic("support-api", "service-secret")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ssn").value("123-45-6789"));
  }

  @Test
  void humanCredentialsRejectedOnInternalApi() throws Exception {
    mockMvc
        .perform(
            get("/internal/customers/00000000-0000-0000-0000-000000000001")
                .with(httpBasic("support", "wrong")))
        .andExpect(status().isUnauthorized());
  }
}
