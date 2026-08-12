package com.vibhu.security.idanywhere.idp;

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
class IdpStandinSmokeTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void openIdConfiguration_isPublic() throws Exception {
        mockMvc.perform(get("/.well-known/openid-configuration"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.issuer").value("http://localhost:9080"))
                .andExpect(jsonPath("$.authorization_endpoint").value("http://localhost:9080/oauth2/authorize"))
                .andExpect(jsonPath("$.token_endpoint").value("http://localhost:9080/oauth2/token"))
                .andExpect(jsonPath("$.jwks_uri").value("http://localhost:9080/oauth2/jwks"));
    }
}
