package com.vibhu.aifp.assistant.security;

import com.vibhu.aifp.common.UserContext;
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
    String userId = request.getHeader("X-User-Id");
    if (userId == null || userId.isBlank()) {
      userId = "support-demo";
    }
    UserContext context =
        new UserContext(userId, UserContextHolder.parseRole(request.getHeader("X-User-Role")), "TENANT-1");
    UserContextHolder.set(context);
    try {
      filterChain.doFilter(request, response);
    } finally {
      UserContextHolder.clear();
    }
  }
}
