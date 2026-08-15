package com.vibhu.multitenant.security;

import com.vibhu.multitenant.exception.MultiTenantException;
import com.vibhu.multitenant.exception.TenantExceptions;
import com.vibhu.multitenant.tenant.TenantEntity;
import com.vibhu.multitenant.tenant.context.TenantContext;
import com.vibhu.multitenant.tenant.resolver.CompositeTenantResolver;
import com.vibhu.multitenant.tenant.service.TenantLookupService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class TenantFilter extends OncePerRequestFilter {

  private final CompositeTenantResolver resolver;
  private final TenantLookupService tenants;

  public TenantFilter(CompositeTenantResolver resolver, TenantLookupService tenants) {
    this.resolver = resolver;
    this.tenants = tenants;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    return path.startsWith("/actuator")
        || path.startsWith("/api/auth/")
        || path.startsWith("/api/lab/token")
        || path.equals("/api/tenants") && "POST".equalsIgnoreCase(request.getMethod())
        || path.equals("/error");
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    try {
      Optional<String> slug = resolver.resolveSlug(request);
      Authentication auth = SecurityContextHolder.getContext().getAuthentication();
      UUID userId = null;
      String roles = null;
      if (auth != null && auth.getPrincipal() instanceof TenantUserPrincipal principal) {
        userId = principal.getUserId();
        roles =
            String.join(
                ",", principal.getAuthorities().stream().map(a -> a.getAuthority()).toList());
        if (slug.isPresent() && !slug.get().equals(principal.getTenantSlug())) {
          throw TenantExceptions.mismatch();
        }
        if (slug.isEmpty()) {
          slug = Optional.of(principal.getTenantSlug());
        }
      }
      if (slug.isEmpty()) {
        if (auth == null
            || !auth.isAuthenticated()
            || "anonymousUser".equals(String.valueOf(auth.getPrincipal()))) {
          filterChain.doFilter(request, response);
          return;
        }
        throw TenantExceptions.missing();
      }
      TenantEntity tenant = tenants.requireActive(slug.get());
      TenantContext.set(
          new TenantContext.TenantSnapshot(
              tenant.getId(),
              tenant.getSlug(),
              tenant.getStatus().name(),
              tenant.getDatabaseStrategy().name(),
              userId,
              roles));
      MDC.put("tenantId", tenant.getSlug());
      if (userId != null) {
        MDC.put("userId", userId.toString());
      }
      String trace = request.getHeader("X-Trace-Id");
      if (trace == null || trace.isBlank()) {
        trace = UUID.randomUUID().toString();
      }
      MDC.put("traceId", trace);
      filterChain.doFilter(request, response);
    } catch (MultiTenantException ex) {
      response.setStatus(ex.httpStatus());
      response.setContentType("application/json");
      response
          .getWriter()
          .write("{\"error\":\"" + ex.code() + "\",\"message\":\"" + ex.getMessage() + "\"}");
    } finally {
      TenantContext.clear();
      MDC.remove("tenantId");
      MDC.remove("userId");
      MDC.remove("traceId");
    }
  }
}
