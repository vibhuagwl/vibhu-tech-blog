package com.vibhu.bloom;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vibhu.bloom.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    properties = {
      "bloom.seed-users=200",
      "bloom.expected-insertions=10000",
      "bloom.false-positive-rate=0.01"
    })
@AutoConfigureMockMvc
class UserLookupIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired UserService users;

  @Test
  void existingUserReturned() throws Exception {
    mvc.perform(get("/api/users/user-1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("user-1"));
  }

  @Test
  void missingUserShortCircuitsWith404() throws Exception {
    mvc.perform(get("/api/users/definitely-missing-xyz"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error").value("not_found"));
  }

  @Test
  void createUserUpdatesBloom() throws Exception {
    mvc.perform(
            post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                {"id":"user-new-42","displayName":"New","email":"new42@example.com"}
                """))
        .andExpect(status().isCreated());

    mvc.perform(get("/api/users/user-new-42"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("user-new-42"));
  }

  @Test
  void bloomStatsExposed() throws Exception {
    mvc.perform(get("/api/bloom/stats"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.bitSize").isNumber())
        .andExpect(jsonPath("$.hashCount").isNumber())
        .andExpect(jsonPath("$.inserted").isNumber());
  }

  @Test
  void mightContainEndpoint() throws Exception {
    mvc.perform(get("/api/bloom/might-contain").param("id", "user-1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mightContain").value(true));
  }
}
