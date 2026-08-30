package com.example.kafka;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@TestConfiguration
public class TestSecurityOverrides {

    @Bean
    @Primary
    JwtDecoder jwtDecoder() {
        return token -> {
            if (token == null || token.equals("not-a-jwt")) {
                throw new BadJwtException("Invalid or expired access token");
            }
            return Jwt.withTokenValue(token)
                    .header("alg", "none")
                    .claim("sub", "test")
                    .claim("aud", "payment-api")
                    .build();
        };
    }
}
