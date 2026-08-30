package com.example.kafka.security;

/**
 * Application-level token source for client-credentials JWTs.
 * <p>
 * Kafka clients do <em>not</em> call this through Spring Security. The broker/client SASL
 * handshake uses {@code AuthenticateCallbackHandler} + {@code OAuthBearerTokenCallback}
 * (see {@link OAuthBearerTokenCallbackHandler} and Kafka's
 * {@code OAuthBearerLoginCallbackHandler}).
 */
public interface KafkaOAuthTokenProvider {

    String getAccessToken();
}
