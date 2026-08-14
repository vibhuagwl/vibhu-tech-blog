package com.vibhu.multitenant.tenant.resolver;

import com.vibhu.multitenant.config.MultiTenantProperties;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class HeaderTenantResolver implements TenantResolver {

  private final MultiTenantProperties properties;

  public HeaderTenantResolver(MultiTenantProperties properties) {
    this.properties = properties;
  }

  @Override
  public Optional<String> resolveSlug(HttpServletRequest request) {
    String value = request.getHeader(properties.getHeaderName());
    if (value == null || value.isBlank()) {
      return Optional.empty();
    }
    return Optional.of(value.trim().toLowerCase());
  }
}
