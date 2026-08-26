package com.vibhu.sapi.orchestrator.security;

import com.vibhu.sapi.enums.Role;
import com.vibhu.sapi.security.UserContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class UserContextFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    try {
      String auth = request.getHeader("Authorization");
      if (auth != null && auth.startsWith("Bearer demo")) {
        RequestUserContext.set(UserContext.demo());
      } else {
        String userId = headerOrDefault(request, "X-User-Id", "demo-support");
        String role = headerOrDefault(request, "X-User-Role", "SUPPORT");
        RequestUserContext.set(new UserContext(userId, Role.valueOf(role.toUpperCase()), "TENANT-1"));
      }
      filterChain.doFilter(request, response);
    } finally {
      RequestUserContext.clear();
    }
  }

  private static String headerOrDefault(HttpServletRequest request, String name, String fallback) {
    String value = request.getHeader(name);
    return value == null || value.isBlank() ? fallback : value;
  }
}
