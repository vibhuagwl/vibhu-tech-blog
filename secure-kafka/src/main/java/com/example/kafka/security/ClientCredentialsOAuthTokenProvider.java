package com.example.kafka.security;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Client-credentials grant against the IdP token endpoint. Caches the access token and refreshes
 * before {@code exp} (30s skew) — same fail-closed posture as the Spring Security hub: an IdP
 * outage is an authentication failure, not a bypass.
 */
public class ClientCredentialsOAuthTokenProvider implements KafkaOAuthTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(ClientCredentialsOAuthTokenProvider.class);
    private static final long SKEW_SECONDS = 30;

    private final RestClient restClient;
    private final String tokenEndpoint;
    private final String clientId;
    private final String clientSecret;
    private final String scope;

    private final Object lock = new Object();
    private volatile CachedToken cached;

    public ClientCredentialsOAuthTokenProvider(
            RestClient restClient, String tokenEndpoint, String clientId, String clientSecret, String scope) {
        this.restClient = Objects.requireNonNull(restClient, "restClient");
        this.tokenEndpoint = Objects.requireNonNull(tokenEndpoint, "tokenEndpoint");
        this.clientId = Objects.requireNonNull(clientId, "clientId");
        this.clientSecret = Objects.requireNonNull(clientSecret, "clientSecret");
        this.scope = scope;
    }

    @Override
    public String getAccessToken() {
        CachedToken current = cached;
        if (current != null && current.expiresAt.minusSeconds(SKEW_SECONDS).isAfter(Instant.now())) {
            return current.value;
        }
        synchronized (lock) {
            current = cached;
            if (current != null && current.expiresAt.minusSeconds(SKEW_SECONDS).isAfter(Instant.now())) {
                return current.value;
            }
            TokenResponse response = fetch();
            Instant expiresAt = Instant.now().plusSeconds(response.expiresIn() > 0 ? response.expiresIn() : 60);
            cached = new CachedToken(response.accessToken(), expiresAt);
            log.debug("Fetched OAuth access token for client {} expiring at {}", clientId, expiresAt);
            return cached.value;
        }
    }

    public void evict() {
        synchronized (lock) {
            cached = null;
        }
    }

    private TokenResponse fetch() {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        if (StringUtils.hasText(scope)) {
            form.add("scope", scope);
        }
        String basic = Base64.getEncoder()
                .encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
        try {
            TokenResponse response = restClient.post()
                    .uri(tokenEndpoint)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .header("Authorization", "Basic " + basic)
                    .body(form)
                    .retrieve()
                    .body(TokenResponse.class);
            if (response == null || !StringUtils.hasText(response.accessToken())) {
                throw new IllegalStateException("IdP returned an empty access_token");
            }
            return response;
        } catch (RestClientException ex) {
            throw new IllegalStateException("OAuth client-credentials grant failed for " + clientId, ex);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TokenResponse(
            @JsonProperty("access_token") String accessToken,
            @JsonProperty("expires_in") long expiresIn,
            @JsonProperty("token_type") String tokenType,
            @JsonProperty("scope") String scope) {
    }

    private record CachedToken(String value, Instant expiresAt) {
    }
}
