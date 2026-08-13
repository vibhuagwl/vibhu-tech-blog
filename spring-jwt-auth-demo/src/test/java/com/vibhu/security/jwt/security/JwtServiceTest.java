package com.vibhu.security.jwt.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vibhu.security.jwt.config.JwtProperties;
import com.vibhu.security.jwt.exception.InvalidTokenException;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private JwtService jwtService;
    private JwtProperties properties;

    @BeforeEach
    void setUp() {
        properties = new JwtProperties();
        properties.getJwt().setIssuer("spring-jwt-auth-demo");
        properties.getJwt().setAudience("spring-jwt-auth-api");
        properties.getJwt().setAccessTokenExpiration(Duration.ofMinutes(15));
        properties.getJwt().setClockSkew(Duration.ofSeconds(30));
        properties.getJwt().setSecret("test-hmac-key-must-be-at-least-32b!");
        jwtService = new JwtService(properties, new EnvironmentJwtSecretProvider(properties));
    }

    @Test
    void validTokenRoundTrip() {
        String token = jwtService.generateAccessToken("user@example.com", List.of("ROLE_USER"));
        assertThat(jwtService.extractUsername(token)).isEqualTo("user@example.com");
        assertThat(jwtService.extractRoles(token)).containsExactly("ROLE_USER");
        assertThat(jwtService.isTokenExpired(token)).isFalse();
        assertThat(jwtService.validateToken(token).getIssuer()).isEqualTo("spring-jwt-auth-demo");
        assertThat(jwtService.validateToken(token).getAudience()).contains("spring-jwt-auth-api");
        assertThat(jwtService.extractJti(token)).isNotBlank();
    }

    @Test
    void expiredToken() {
        Instant now = Instant.now();
        String token = jwtService.generateAccessToken(
                "user@example.com",
                List.of("ROLE_USER"),
                now.minus(Duration.ofHours(2)),
                now.minus(Duration.ofMinutes(1)),
                properties.getJwt().getIssuer(),
                properties.getJwt().getAudience(),
                jwtService.currentKey());
        assertThat(jwtService.isTokenExpired(token)).isTrue();
        assertThatThrownBy(() -> jwtService.validateToken(token))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void invalidSignature() {
        SecretKey other = Keys.hmacShaKeyFor("other-hmac-key-must-be-32-bytes!!".getBytes(StandardCharsets.UTF_8));
        Instant now = Instant.now();
        String token = jwtService.generateAccessToken(
                "user@example.com",
                List.of("ROLE_USER"),
                now,
                now.plus(Duration.ofMinutes(15)),
                properties.getJwt().getIssuer(),
                properties.getJwt().getAudience(),
                other);
        assertThatThrownBy(() -> jwtService.validateToken(token)).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void wrongIssuer() {
        Instant now = Instant.now();
        String token = jwtService.generateAccessToken(
                "user@example.com",
                List.of("ROLE_USER"),
                now,
                now.plus(Duration.ofMinutes(15)),
                "other-issuer",
                properties.getJwt().getAudience(),
                jwtService.currentKey());
        assertThatThrownBy(() -> jwtService.validateToken(token)).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void wrongAudience() {
        Instant now = Instant.now();
        String token = jwtService.generateAccessToken(
                "user@example.com",
                List.of("ROLE_USER"),
                now,
                now.plus(Duration.ofMinutes(15)),
                properties.getJwt().getIssuer(),
                "other-audience",
                jwtService.currentKey());
        assertThatThrownBy(() -> jwtService.validateToken(token)).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void missingSubject() {
        Instant now = Instant.now();
        String token = jwtService.generateAccessToken(
                "",
                List.of("ROLE_USER"),
                now,
                now.plus(Duration.ofMinutes(15)),
                properties.getJwt().getIssuer(),
                properties.getJwt().getAudience(),
                jwtService.currentKey());
        assertThatThrownBy(() -> jwtService.extractUsername(token)).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void malformedToken() {
        assertThatThrownBy(() -> jwtService.validateToken("not-a-jwt"))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void previousSecretStillVerifiesDuringRotation() {
        JwtProperties rotated = new JwtProperties();
        rotated.getJwt().setIssuer("spring-jwt-auth-demo");
        rotated.getJwt().setAudience("spring-jwt-auth-api");
        rotated.getJwt().setClockSkew(Duration.ofSeconds(30));
        rotated.getJwt().setSecret("new-hmac-key-must-be-at-least-32b!");
        rotated.getJwt().setPreviousSecret("test-hmac-key-must-be-at-least-32b!");
        JwtService rotator = new JwtService(rotated, new EnvironmentJwtSecretProvider(rotated));
        String tokenSignedWithOldKey = jwtService.generateAccessToken("user@example.com", List.of("ROLE_USER"));
        assertThat(rotator.extractUsername(tokenSignedWithOldKey)).isEqualTo("user@example.com");
    }
}
