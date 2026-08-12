package com.vibhu.security.audit.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.security.pii.common.secrets.SecretProvider;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.boot.jdbc.DataSourceBuilder;
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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Bean
    DataSource dataSource(SecretProvider secrets) {
        return DataSourceBuilder.create()
                .driverClassName("org.h2.Driver")
                .url("jdbc:h2:mem:audit;MODE=PostgreSQL;DB_CLOSE_DELAY=-1")
                .username("audit")
                .password(secrets.require("DB_PASSWORD"))
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    UserDetailsService userDetailsService(SecretProvider secrets, PasswordEncoder encoder) {
        UserDetails serviceClient = User.builder()
                .username(secrets.optional("SERVICE_CLIENT_USER", "support-api"))
                .password(encoder.encode(secrets.require("SERVICE_CLIENT_PASSWORD")))
                .roles("SERVICE")
                .build();
        UserDetails compliance = User.builder()
                .username(secrets.optional("COMPLIANCE_USER", "compliance"))
                .password(encoder.encode(secrets.require("COMPLIANCE_PASSWORD")))
                .roles("COMPLIANCE")
                .build();
        return new InMemoryUserDetailsManager(serviceClient, compliance);
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/internal/audit/pii-access").hasRole("SERVICE")
                        .requestMatchers("/internal/audit/**").hasRole("COMPLIANCE")
                        .anyRequest().denyAll())
                .httpBasic(Customizer.withDefaults())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> {
                            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(res.getOutputStream(),
                                    Map.of("error", "unauthorized", "message", "Credentials required"));
                        }));
        return http.build();
    }
}
