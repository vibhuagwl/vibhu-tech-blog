package com.example.kafka.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import javax.security.auth.callback.UnsupportedCallbackException;
import javax.security.auth.login.AppConfigurationEntry;
import org.apache.kafka.common.security.oauthbearer.OAuthBearerLoginModule;
import org.apache.kafka.common.security.oauthbearer.OAuthBearerTokenCallback;
import org.junit.jupiter.api.Test;

class OAuthBearerTokenCallbackHandlerTest {

    @Test
    void validToken_isReturnedOnCallback() throws Exception {
        String jwt = unsignedJwt("payment-producer", 3_600);
        OAuthBearerTokenCallbackHandler handler = new OAuthBearerTokenCallbackHandler(() -> jwt);
        OAuthBearerTokenCallback callback = new OAuthBearerTokenCallback();

        handler.configure(Map.of(), "OAUTHBEARER", List.of());
        handler.handle(new javax.security.auth.callback.Callback[] {callback});

        assertThat(callback.token()).isNotNull();
        assertThat(callback.token().value()).isEqualTo(jwt);
        assertThat(callback.token().principalName()).isEqualTo("payment-producer");
    }

    @Test
    void tokenFetchFailure_reportsSaslError() throws Exception {
        OAuthBearerTokenCallbackHandler handler =
                new OAuthBearerTokenCallbackHandler(() -> {
                    throw new IllegalStateException("invalid_client");
                });
        OAuthBearerTokenCallback callback = new OAuthBearerTokenCallback();

        handler.handle(new javax.security.auth.callback.Callback[] {callback});

        assertThat(callback.token()).isNull();
        assertThat(callback.errorCode()).isEqualTo("invalid_grant");
    }

    @Test
    void configure_readsJaasClientCredentials() {
        OAuthBearerTokenCallbackHandler handler = new OAuthBearerTokenCallbackHandler();
        AppConfigurationEntry entry = new AppConfigurationEntry(
                OAuthBearerLoginModule.class.getName(),
                AppConfigurationEntry.LoginModuleControlFlag.REQUIRED,
                Map.of("clientId", "payment-producer", "clientSecret", "secret", "scope", "kafka"));

        handler.configure(
                Map.of("sasl.oauthbearer.token.endpoint.url", "http://localhost:8080/token"),
                "OAUTHBEARER",
                List.of(entry));

        assertThat(handler).isNotNull();
    }

    @Test
    void unsupportedCallback_isRejected() {
        OAuthBearerTokenCallbackHandler handler = new OAuthBearerTokenCallbackHandler(() -> "x");
        javax.security.auth.callback.Callback unknown = new javax.security.auth.callback.NameCallback("x");
        assertThatThrownBy(() -> handler.handle(new javax.security.auth.callback.Callback[] {unknown}))
                .isInstanceOf(UnsupportedCallbackException.class);
    }

    @Test
    void parseJwt_usesAzpAsPrincipal() {
        String jwt = unsignedJwt("payment-consumer", 120);
        assertThat(ClientCredentialsOAuthBearerToken.parse(jwt).principalName()).isEqualTo("payment-consumer");
        assertThat(ClientCredentialsOAuthBearerToken.parse(jwt).scope()).contains("kafka");
    }

    static String unsignedJwt(String azp, long expiresInSeconds) {
        String header = b64("{\"alg\":\"none\",\"typ\":\"JWT\"}");
        long now = System.currentTimeMillis() / 1000;
        String payload = b64("{\"azp\":\"" + azp + "\",\"sub\":\"uuid\",\"scope\":\"kafka\",\"iat\":" + now + ",\"exp\":"
                + (now + expiresInSeconds) + "}");
        return header + "." + payload + ".";
    }

    private static String b64(String json) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes(StandardCharsets.UTF_8));
    }
}
