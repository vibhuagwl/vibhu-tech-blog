package com.vibhu.msp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Demo-only OAuth2/JWT resource-server stub — validates a fixed bearer token.
 * Not for production; illustrates filter-chain placement for JWT validation.
 */
public final class DemoJwtAuthFilter extends OncePerRequestFilter {

  public static final String DEMO_BEARER = "demo-jwt-token";
  private static final Set<String> PUBLIC_PATHS = Set.of("/api/lab/health", "/actuator/health");

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {
    String path = request.getRequestURI();
    if (isPublic(path)) {
      filterChain.doFilter(request, response);
      return;
    }
    String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (auth == null || !auth.equals("Bearer " + DEMO_BEARER)) {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.setContentType("application/json");
      response.getWriter().write("{\"error\":\"invalid_token\",\"message\":\"Demo JWT required\"}");
      return;
    }
    request.setAttribute("demo.principal", "lab-user");
    filterChain.doFilter(request, response);
  }

  private boolean isPublic(String path) {
    return PUBLIC_PATHS.stream().anyMatch(path::endsWith);
  }
}
