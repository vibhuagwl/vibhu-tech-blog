package com.vibhu.security.pii.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.security.pii.common.secrets.SecretProvider;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/** customer-service is internal-only — only other microservices (support-api) may call it. */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Bean
  PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
  }

  @Bean
  UserDetailsService userDetailsService(SecretProvider secrets, PasswordEncoder encoder) {
    UserDetails serviceClient =
        User.builder()
            .username(secrets.optional("SERVICE_CLIENT_USER", "support-api"))
            .password(encoder.encode(secrets.require("SERVICE_CLIENT_PASSWORD")))
            .roles("SERVICE")
            .build();
    return new InMemoryUserDetailsManager(serviceClient);
  }

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers("/actuator/health", "/actuator/info")
                    .permitAll()
                    .requestMatchers("/internal/**")
                    .hasRole("SERVICE")
                    .anyRequest()
                    .denyAll())
        .httpBasic(Customizer.withDefaults())
        .exceptionHandling(
            ex ->
                ex.authenticationEntryPoint(
                        (req, res, e) -> {
                          res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                          res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                          objectMapper.writeValue(
                              res.getOutputStream(),
                              Map.of(
                                  "error",
                                  "unauthorized",
                                  "message",
                                  "Service credentials required"));
                        })
                    .accessDeniedHandler(
                        (req, res, e) -> {
                          res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                          res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                          objectMapper.writeValue(
                              res.getOutputStream(),
                              Map.of("error", "forbidden", "message", "Internal service only"));
                        }));
    return http.build();
  }
}
