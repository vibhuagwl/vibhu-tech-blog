package com.example.kafka.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;
import org.apache.kafka.common.security.oauthbearer.OAuthBearerToken;

/**
 * Minimal {@link OAuthBearerToken} wrapping a compact JWT. Signature validation is the broker's
 * job ({@code OAuthBearerValidatorCallbackHandler} + JWKS), not the client's.
 */
public final class ClientCredentialsOAuthBearerToken implements OAuthBearerToken {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final String value;
    private final String principalName;
    private final long lifetimeMs;
    private final Long startTimeMs;
    private final Set<String> scope;

    public ClientCredentialsOAuthBearerToken(
            String value, String principalName, long lifetimeMs, Long startTimeMs, Set<String> scope) {
        this.value = value;
        this.principalName = principalName;
        this.lifetimeMs = lifetimeMs;
        this.startTimeMs = startTimeMs;
        this.scope = Set.copyOf(scope);
    }

    public static ClientCredentialsOAuthBearerToken parse(String jwt) {
        JsonNode payload = decodePayload(jwt);
        String principal = firstText(payload, "azp", "cid", "client_id", "sub");
        long exp = payload.path("exp").asLong(0) * 1000L;
        long iat = payload.path("iat").asLong(0) * 1000L;
        Set<String> scopes = new LinkedHashSet<>();
        if (payload.has("scope") && payload.get("scope").isTextual()) {
            Collections.addAll(scopes, payload.get("scope").asText().split("\\s+"));
        }
        JsonNode scp = payload.get("scp");
        if (scp != null && scp.isArray()) {
            scp.forEach(node -> scopes.add(node.asText()));
        }
        return new ClientCredentialsOAuthBearerToken(jwt, principal, exp, iat == 0 ? null : iat, scopes);
    }

    private static JsonNode decodePayload(String jwt) {
        try {
            String[] parts = jwt.split("\\.");
            if (parts.length < 2) {
                throw new IllegalArgumentException("Not a compact JWT");
            }
            byte[] json = Base64.getUrlDecoder().decode(pad(parts[1]));
            return MAPPER.readTree(new String(json, StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Unable to parse OAuth access token", ex);
        }
    }

    private static String pad(String part) {
        int rem = part.length() % 4;
        return rem == 0 ? part : part + "====".substring(rem);
    }

    private static String firstText(JsonNode payload, String... fields) {
        for (String field : fields) {
            if (payload.hasNonNull(field)) {
                return payload.get(field).asText();
            }
        }
        return "unknown";
    }

    @Override
    public String value() {
        return value;
    }

    @Override
    public Set<String> scope() {
        return scope;
    }

    @Override
    public long lifetimeMs() {
        return lifetimeMs;
    }

    @Override
    public String principalName() {
        return principalName;
    }

    @Override
    public Long startTimeMs() {
        return startTimeMs;
    }
}
