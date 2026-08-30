package com.example.kafka.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.kafka.config.KafkaSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.match.MockRestRequestMatchers;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.web.client.RestClient;

class ClientCredentialsOAuthTokenProviderTest {

    @Test
    void cachesTokenUntilSkewWindow() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(MockRestRequestMatchers.requestTo("http://localhost/token"))
                .andRespond(MockRestResponseCreators.withSuccess(
                        "{\"access_token\":\"tok-1\",\"expires_in\":3600}", MediaType.APPLICATION_JSON));

        ClientCredentialsOAuthTokenProvider provider = new ClientCredentialsOAuthTokenProvider(
                builder.build(), "http://localhost/token", "payment-producer", "secret", "kafka");

        assertThat(provider.getAccessToken()).isEqualTo("tok-1");
        assertThat(provider.getAccessToken()).isEqualTo("tok-1");
        server.verify();
    }

    @Test
    void idpFailure_isAuthenticationFailure() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(MockRestRequestMatchers.requestTo("http://localhost/token"))
                .andRespond(MockRestResponseCreators.withUnauthorizedRequest());

        ClientCredentialsOAuthTokenProvider provider = new ClientCredentialsOAuthTokenProvider(
                builder.build(), "http://localhost/token", "payment-producer", "bad", "kafka");

        assertThatThrownBy(provider::getAccessToken)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("client-credentials");
    }

    @Test
    void oauthJaas_usesKafkaLoginModuleOptionNames() {
        String jaas = KafkaSecurityConfig.oauthJaas("payment-producer", "s3cret", "kafka");
        assertThat(jaas)
                .startsWith("org.apache.kafka.common.security.oauthbearer.OAuthBearerLoginModule required")
                .contains("clientId=\"payment-producer\"")
                .contains("clientSecret=\"s3cret\"")
                .contains("scope=\"kafka\"")
                .endsWith(";");
    }
}
