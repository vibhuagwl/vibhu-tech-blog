package com.vibhu.multitenant.tenant.resolver;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class SubdomainTenantResolver implements TenantResolver {

  @Override
  public Optional<String> resolveSlug(HttpServletRequest request) {
    String host = request.getServerName();
    if (host == null || host.equals("localhost") || host.equals("127.0.0.1")) {
      return Optional.empty();
    }
    String[] parts = host.split("\\.");
    if (parts.length < 3) {
      return Optional.empty();
    }
    String subdomain = parts[0].toLowerCase();
    if ("www".equals(subdomain) || "api".equals(subdomain)) {
      return Optional.empty();
    }
    return Optional.of(subdomain);
  }
}
