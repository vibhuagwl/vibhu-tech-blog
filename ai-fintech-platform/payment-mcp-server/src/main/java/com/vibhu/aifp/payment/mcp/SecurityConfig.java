package com.vibhu.aifp.payment.mcp;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Production MUST authenticate MCP endpoints — Spring AI MCP starter does not provide auth.
 * Local dev: set app.mcp.security.enabled=false to disable API key check.
 */
@Configuration
public class SecurityConfig {

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http, McpApiKeyFilter apiKeyFilter)
      throws Exception {
    http.csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth.requestMatchers("/actuator/**").permitAll().anyRequest().authenticated())
        .httpBasic(Customizer.withDefaults())
        .addFilterBefore(apiKeyFilter, AbstractPreAuthenticatedProcessingFilter.class);
    return http.build();
  }

  @Component
  static class McpApiKeyFilter extends OncePerRequestFilter {

    @Value("${app.mcp.security.enabled:true}")
    private boolean enabled;

    @Value("${app.mcp.api-key:dev-mcp-key}")
    private String expectedKey;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
      if (!enabled || request.getRequestURI().startsWith("/actuator")) {
        filterChain.doFilter(request, response);
        return;
      }
      String key = request.getHeader("X-MCP-API-KEY");
      if (expectedKey.equals(key)) {
        filterChain.doFilter(request, response);
        return;
      }
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.getWriter().write("Missing or invalid X-MCP-API-KEY");
    }
  }
}
