package com.vibhu.security.jwt.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class AuthApiIntegrationTest {

    private static final String LOGIN_JSON = """
            {"email":"user@example.com","password":"StrongPassword123!"}
            """;
    private static final String ADMIN_LOGIN_JSON = """
            {"email":"admin@example.com","password":"StrongPassword123!"}
            """;

    @Autowired
    MockMvc mockMvc;
    @Autowired
    ObjectMapper objectMapper;

    @Test
    void registerDuplicateReturns409() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"user@example.com","password":"StrongPassword123!"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void registerValidationReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-an-email","password":"short"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void registerCreatesUserWithoutPasswordHash() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"fresh@example.com","password":"StrongPassword123!"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("fresh@example.com"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_USER"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void invalidPasswordReturns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"user@example.com","password":"WrongPassword1!"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void loginThenMeThenAdminForbidden() throws Exception {
        String access = login(LOGIN_JSON).get("accessToken").asText();
        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@example.com"));
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + access))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void meWithoutTokenIs401() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void malformedBearerIs401() throws Exception {
        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCanListUsers() throws Exception {
        String access = login(ADMIN_LOGIN_JSON).get("accessToken").asText();
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").exists());
    }

    @Test
    void refreshRotatesAndOldRefreshFails() throws Exception {
        JsonNode tokens = login(LOGIN_JSON);
        String refresh = tokens.get("refreshToken").asText();
        MvcResult rotated = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andReturn();
        JsonNode body = objectMapper.readTree(rotated.getResponse().getContentAsString());
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + body.get("accessToken").asText()))
                .andExpect(status().isOk());
    }

    @Test
    void logoutRevokesRefreshAndAccessJti() throws Exception {
        JsonNode tokens = login(LOGIN_JSON);
        String access = tokens.get("accessToken").asText();
        String refresh = tokens.get("refreshToken").asText();
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + access))
                .andExpect(status().isUnauthorized());
    }

    private JsonNode login(String json) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }
}
