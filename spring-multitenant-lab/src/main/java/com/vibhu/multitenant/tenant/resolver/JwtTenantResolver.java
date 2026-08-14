package com.vibhu.multitenant.tenant.resolver;

import com.vibhu.multitenant.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class JwtTenantResolver implements TenantResolver {

  private final JwtService jwtService;

  public JwtTenantResolver(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  public Optional<String> resolveSlug(HttpServletRequest request) {
    String auth = request.getHeader("Authorization");
    if (auth == null || !auth.startsWith("Bearer ")) {
      return Optional.empty();
    }
    try {
      return Optional.ofNullable(jwtService.parse(auth.substring(7)).tenantSlug());
    } catch (Exception ex) {
      return Optional.empty();
    }
  }
}
