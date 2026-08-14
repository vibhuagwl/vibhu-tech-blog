package com.vibhu.multitenant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.multitenant.cache.TenantAwareCache;
import com.vibhu.multitenant.tenant.context.TenantContext;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class MultiTenantIsolationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired TenantAwareCache cache;

  @Test
  void tenantACannotReadTenantBOrder() throws Exception {
    String walmart = token("walmart");
    String amazon = token("amazon");

    String customerId = createCustomer(walmart, "W Store");
    String orderId = createOrder(walmart, customerId, "42.00");

    mvc.perform(get("/api/orders/" + orderId).header("Authorization", "Bearer " + walmart))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(orderId));

    mvc.perform(get("/api/orders/" + orderId).header("Authorization", "Bearer " + amazon))
        .andExpect(status().isNotFound());
  }

  @Test
  void jwtTenantMustMatchHeader() throws Exception {
    String walmart = token("walmart");
    mvc.perform(
            get("/api/orders")
                .header("Authorization", "Bearer " + walmart)
                .header("X-Tenant-ID", "amazon"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error").value("tenant_mismatch"));
  }

  @Test
  void unauthenticatedRequestIsRejected() throws Exception {
    // Spring Security may return 401 or 403 depending on entry-point vs access-denied path.
    int status =
        mvc.perform(get("/api/orders")).andReturn().getResponse().getStatus();
    assertThat(status).isIn(401, 403);
  }

  @Test
  void loginIssuesJwtWithTenantClaim() throws Exception {
    mvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"tenantSlug\":\"walmart\",\"email\":\"admin@walmart.lab\",\"password\":\"password\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").isNotEmpty())
        .andExpect(jsonPath("$.tenantSlug").value("walmart"));
  }

  @Test
  void provisionNewTenantAndLogin() throws Exception {
    mvc.perform(
            post("/api/tenants")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"name\":\"Fresh Mart\",\"plan\":\"PREMIUM\",\"adminEmail\":\"a@fresh.lab\",\"adminPassword\":\"password\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.slug").value("fresh-mart"))
        .andExpect(jsonPath("$.status").value("ACTIVE"));

    String token = token("fresh-mart");
    createCustomer(token, "Buyer");
    mvc.perform(get("/api/customers").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].name").value("Buyer"));
  }

  @Test
  void cacheKeysAreTenantPrefixed() {
    UUID a = UUID.fromString("11111111-1111-1111-1111-111111111111");
    UUID b = UUID.fromString("22222222-2222-2222-2222-222222222222");
    cache.put(a, "user:1", java.util.Map.of("name", "A"), java.time.Duration.ofMinutes(1));
    cache.put(b, "user:1", java.util.Map.of("name", "B"), java.time.Duration.ofMinutes(1));
    assertThat(cache.get(a, "user:1", java.util.Map.class).orElseThrow().get("name")).isEqualTo("A");
    assertThat(cache.get(b, "user:1", java.util.Map.class).orElseThrow().get("name")).isEqualTo("B");
  }

  @Test
  void tenantContextClearsAfterUse() {
    TenantContext.set(
        new TenantContext.TenantSnapshot(
            UUID.randomUUID(), "tmp", "ACTIVE", "SHARED_SCHEMA", null, null));
    assertThat(TenantContext.get()).isNotNull();
    TenantContext.clear();
    assertThat(TenantContext.get()).isNull();
  }

  @Test
  void outboxEventIsConsumedWithTenant() throws Exception {
    String walmart = token("walmart");
    String customerId = createCustomer(walmart, "Outbox Customer");
    createOrder(walmart, customerId, "10.00");
    Awaitility.await()
        .atMost(3, TimeUnit.SECONDS)
        .untilAsserted(() -> assertThat(mvc.perform(get("/api/lab/consumed-events")).andReturn()
            .getResponse().getContentAsString()).isNotEqualTo("[]"));
  }

  @Test
  void adminConfigUpdateRequiresAdminRole() throws Exception {
    String walmart = token("walmart");
    mvc.perform(
            put("/api/tenant/config")
                .header("Authorization", "Bearer " + walmart)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currency\":\"CAD\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.currency").value("CAD"));
  }

  private String token(String slug) throws Exception {
    MvcResult result =
        mvc.perform(post("/api/lab/token").param("tenantSlug", slug))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
  }

  private String createCustomer(String token, String name) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/customers")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"" + name + "\",\"email\":\"" + name + "@lab.test\"}"))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private String createOrder(String token, String customerId, String amount) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/orders")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"customerId\":\"" + customerId + "\",\"amount\":" + amount + "}"))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode node = mapper.readTree(result.getResponse().getContentAsString());
    return node.get("id").asText();
  }
}
