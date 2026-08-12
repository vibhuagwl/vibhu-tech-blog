package com.vibhu.security.support.config;

import com.vibhu.security.pii.common.secrets.SecretProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    RestClient customerServiceRestClient(SecretProvider secrets) {
        String baseUrl = secrets.optional("CUSTOMER_SERVICE_URL", "http://localhost:8085");
        String user = secrets.optional("SERVICE_CLIENT_USER", "support-api");
        String password = secrets.require("SERVICE_CLIENT_PASSWORD");
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeaders(h -> h.setBasicAuth(user, password))
                .requestFactory(new JdkClientHttpRequestFactory())
                .build();
    }

    @Bean
    RestClient auditServiceRestClient(SecretProvider secrets) {
        String baseUrl = secrets.optional("AUDIT_SERVICE_URL", "http://localhost:8087");
        String user = secrets.optional("SERVICE_CLIENT_USER", "support-api");
        String password = secrets.require("SERVICE_CLIENT_PASSWORD");
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeaders(h -> h.setBasicAuth(user, password))
                .requestFactory(new JdkClientHttpRequestFactory())
                .build();
    }
}
