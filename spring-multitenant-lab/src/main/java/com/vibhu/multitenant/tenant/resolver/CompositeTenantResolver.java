package com.vibhu.multitenant.tenant.resolver;

import com.vibhu.multitenant.config.MultiTenantProperties;
import com.vibhu.multitenant.exception.TenantExceptions;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * Composite strategy: JWT tenant is authoritative. Header/subdomain may be present for routing but
 * MUST match JWT. Never trust X-Tenant-ID alone when a JWT is present.
 */
@Component
public class CompositeTenantResolver implements TenantResolver {

  private final MultiTenantProperties properties;
  private final HeaderTenantResolver header;
  private final JwtTenantResolver jwt;
  private final SubdomainTenantResolver subdomain;

  public CompositeTenantResolver(
      MultiTenantProperties properties,
      HeaderTenantResolver header,
      JwtTenantResolver jwt,
      SubdomainTenantResolver subdomain) {
    this.properties = properties;
    this.header = header;
    this.jwt = jwt;
    this.subdomain = subdomain;
  }

  @Override
  public Optional<String> resolveSlug(HttpServletRequest request) {
    return switch (properties.getResolver().getStrategy().toLowerCase()) {
      case "header" -> header.resolveSlug(request);
      case "jwt" -> jwt.resolveSlug(request);
      case "subdomain" -> subdomain.resolveSlug(request);
      default -> resolveComposite(request);
    };
  }

  private Optional<String> resolveComposite(HttpServletRequest request) {
    Optional<String> fromJwt = jwt.resolveSlug(request);
    Optional<String> fromHeader = header.resolveSlug(request);
    Optional<String> fromHost = subdomain.resolveSlug(request);

    if (fromJwt.isPresent()) {
      if (fromHeader.isPresent() && !fromHeader.get().equals(fromJwt.get())) {
        throw TenantExceptions.mismatch();
      }
      if (fromHost.isPresent() && !fromHost.get().equals(fromJwt.get())) {
        throw TenantExceptions.mismatch();
      }
      return fromJwt;
    }
    return fromHeader.or(() -> fromHost);
  }
}
