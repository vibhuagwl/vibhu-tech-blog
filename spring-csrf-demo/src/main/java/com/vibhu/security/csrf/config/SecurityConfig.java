package com.vibhu.security.csrf.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

/**
 * Two filter chains:
 *
 * <ul>
 *   <li>{@code /spa/**} — CookieCsrfTokenRepository (XSRF-TOKEN) for JS clients
 *   <li>everything else — session CSRF (hidden form field) for classic browser apps
 * </ul>
 *
 * Stateless JWT APIs typically disable CSRF because the browser does not auto-attach a session
 * cookie.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  UserDetailsService users(PasswordEncoder encoder) {
    return new InMemoryUserDetailsManager(
        User.withUsername("alice").password(encoder.encode("password")).roles("USER").build());
  }

  @Bean
  @Order(1)
  SecurityFilterChain spaSecurity(HttpSecurity http) throws Exception {
    CookieCsrfTokenRepository repo = CookieCsrfTokenRepository.withHttpOnlyFalse();
    CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
    requestHandler.setCsrfRequestAttributeName(null);

    http.securityMatcher("/spa/**")
        .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
        .httpBasic(Customizer.withDefaults())
        .csrf(csrf -> csrf.csrfTokenRepository(repo).csrfTokenRequestHandler(requestHandler))
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED));
    return http.build();
  }

  @Bean
  @Order(2)
  SecurityFilterChain browserSecurity(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(
            auth ->
                auth.requestMatchers("/", "/css/**", "/login", "/error", "/actuator/health")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/transfer")
                    .authenticated()
                    .anyRequest()
                    .authenticated())
        .formLogin(
            form -> form.loginPage("/login").defaultSuccessUrl("/transfer", true).permitAll())
        .logout(logout -> logout.logoutSuccessUrl("/login?logout").permitAll())
        // Default: HttpSessionCsrfTokenRepository — Thymeleaf renders ${_csrf.token}
        .csrf(Customizer.withDefaults());
    return http.build();
  }
}
