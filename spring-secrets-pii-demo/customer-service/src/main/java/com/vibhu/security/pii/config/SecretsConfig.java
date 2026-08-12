package com.vibhu.security.pii.config;

import com.vibhu.security.pii.secrets.SecretProvider;
import javax.sql.DataSource;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Wires DB password from SecretProvider — same pattern for Kafka SASL, OAuth client_secret.
 */
@Configuration
public class SecretsConfig {

    @Bean
    DataSource dataSource(SecretProvider secrets) {
        String password = secrets.require("DB_PASSWORD");
        return DataSourceBuilder.create()
                .driverClassName("org.h2.Driver")
                .url("jdbc:h2:mem:customers;MODE=PostgreSQL;DB_CLOSE_DELAY=-1")
                .username("app")
                .password(password)
                .build();
    }
}
