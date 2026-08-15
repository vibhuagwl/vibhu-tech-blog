package com.vibhu.security.idanywhere.api.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

class GroupClaimConverterTest {

  @Test
  void mapsAdfsGroupsToRoles() {
    SecurityConfig config = new SecurityConfig();
    Converter<Jwt, ? extends AbstractAuthenticationToken> converter =
        config.jwtAuthenticationConverter();

    Jwt jwt =
        new Jwt(
            "token",
            Instant.now(),
            Instant.now().plusSeconds(60),
            Map.of("alg", "none"),
            Map.of(
                "sub", "alice",
                "groups", List.of("App.Payments.Users", "App.Payments.Admins"),
                "scope", "openid profile"));

    AbstractAuthenticationToken auth = converter.convert(jwt);
    assertThat(auth).isInstanceOf(JwtAuthenticationToken.class);
    assertThat(auth.getAuthorities().stream().map(GrantedAuthority::getAuthority))
        .contains("ROLE_USER", "ROLE_ADMIN", "SCOPE_openid", "SCOPE_profile");
  }
}
