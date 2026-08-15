package com.vibhu.security.idanywhere.api.config;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

/** Resource Server: validates IDAnywhere/ADFS (or stand-in) JWTs and maps AD groups → roles. */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

  private static final Map<String, String> GROUP_TO_ROLE =
      Map.of(
          "App.Payments.Users", "ROLE_USER",
          "App.Payments.Admins", "ROLE_ADMIN");

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers("/actuator/health")
                    .permitAll()
                    .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/api/**")
                    .authenticated()
                    .anyRequest()
                    .denyAll())
        .oauth2ResourceServer(
            oauth2 ->
                oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));
    return http.build();
  }

  @Bean
  Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(this::authoritiesFromGroups);
    return converter;
  }

  private Collection<GrantedAuthority> authoritiesFromGroups(Jwt jwt) {
    Set<String> groups = new HashSet<>();
    Object raw = jwt.getClaim("groups");
    if (raw instanceof Collection<?> coll) {
      coll.forEach(v -> groups.add(String.valueOf(v)));
    } else if (raw instanceof String s && !s.isBlank()) {
      // ADFS sometimes emits a single group string
      groups.add(s);
    }
    List<GrantedAuthority> authorities =
        groups.stream()
            .map(
                g ->
                    GROUP_TO_ROLE.getOrDefault(
                        g, "ROLE_" + g.replace('.', '_').toUpperCase(Locale.ROOT)))
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
    // Also honor scope claim if present
    Object scope = jwt.getClaim("scope");
    if (scope instanceof String scopeStr) {
      for (String s : scopeStr.split(" ")) {
        if (!s.isBlank()) {
          authorities.add(new SimpleGrantedAuthority("SCOPE_" + s));
        }
      }
    }
    return authorities;
  }
}
