package com.example.kafka.security;

import org.apache.kafka.common.security.auth.AuthenticateCallbackHandler;
import org.apache.kafka.common.security.oauthbearer.OAuthBearerTokenCallback;
import org.springframework.web.client.RestClient;

import javax.security.auth.callback.Callback;
import javax.security.auth.callback.UnsupportedCallbackException;
import javax.security.auth.login.AppConfigurationEntry;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Kafka-instantiated SASL login callback (public no-arg constructor).
 * <p>
 * Handles {@link OAuthBearerTokenCallback} — the real Kafka 3.x API. Kafka does not use Spring
 * Security's resource-server filter here. Production default in {@code application.yml} is still
 * Kafka's own {@code OAuthBearerLoginCallbackHandler}; this class is the same contract with an
 * explicit refresh cache for tests and custom IdP quirks.
 */
public class OAuthBearerTokenCallbackHandler implements AuthenticateCallbackHandler {

    private KafkaOAuthTokenProvider tokenProvider;

    /**
     * Used by Kafka via reflection.
     */
    public OAuthBearerTokenCallbackHandler() {
    }

    /**
     * Tests / Spring-owned wiring.
     */
    public OAuthBearerTokenCallbackHandler(KafkaOAuthTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    public void configure(Map<String, ?> configs, String saslMechanism, List<AppConfigurationEntry> jaasConfigEntries) {
        if (!"OAUTHBEARER".equalsIgnoreCase(saslMechanism)) {
            throw new IllegalArgumentException("This handler only supports OAUTHBEARER, got " + saslMechanism);
        }
        if (tokenProvider != null) {
            return;
        }
        String tokenUrl = stringValue(configs, "sasl.oauthbearer.token.endpoint.url");
        if (jaasConfigEntries == null || jaasConfigEntries.isEmpty()) {
            throw new IllegalStateException("OAUTHBEARER JAAS config is required");
        }
        Map<String, ?> options = jaasConfigEntries.getFirst()
                .getOptions();
        String clientId = stringValue(options, "clientId");
        String clientSecret = stringValue(options, "clientSecret");
        String scope = stringValue(options, "scope");
        this.tokenProvider = new ClientCredentialsOAuthTokenProvider(
                RestClient.create(), tokenUrl, clientId, clientSecret, scope);
    }

    @Override
    public void handle(Callback[] callbacks) throws IOException, UnsupportedCallbackException {
        for (Callback callback : callbacks) {
            if (callback instanceof OAuthBearerTokenCallback tokenCallback) {
                try {
                    String accessToken = tokenProvider.getAccessToken();
                    tokenCallback.token(ClientCredentialsOAuthBearerToken.parse(accessToken));
                } catch (RuntimeException ex) {
                    tokenCallback.error("invalid_grant", ex.getMessage(), null);
                }
            } else {
                throw new UnsupportedCallbackException(callback);
            }
        }
    }

    @Override
    public void close() {
        if (tokenProvider instanceof ClientCredentialsOAuthTokenProvider cached) {
            cached.evict();
        }
    }

    private static String stringValue(Map<String, ?> source, String key) {
        if (source == null) {
            return null;
        }
        Object value = source.get(key);
        return value == null ? null : value.toString();
    }
}
