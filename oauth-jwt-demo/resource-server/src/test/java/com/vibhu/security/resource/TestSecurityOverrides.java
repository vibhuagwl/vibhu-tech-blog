package com.vibhu.security.resource;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@TestConfiguration
public class TestSecurityOverrides {

    @Bean
    @Primary
    JwtDecoder jwtDecoder() {
        // Tests use SecurityMockMvcRequestPostProcessors.jwt() which bypasses decoder.
        // Provide a stub so context starts without contacting the Authorization Server.
        return token -> Jwt.withTokenValue(token)
                .header("alg", "none")
                .claim("sub", "test")
                .build();
    }
}
