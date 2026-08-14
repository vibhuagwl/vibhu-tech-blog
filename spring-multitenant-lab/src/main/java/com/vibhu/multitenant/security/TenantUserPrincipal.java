package com.vibhu.multitenant.security;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class TenantUserPrincipal implements UserDetails {

  private final UUID userId;
  private final String email;
  private final UUID tenantId;
  private final String tenantSlug;
  private final List<String> roles;

  public TenantUserPrincipal(
      UUID userId, String email, UUID tenantId, String tenantSlug, List<String> roles) {
    this.userId = userId;
    this.email = email;
    this.tenantId = tenantId;
    this.tenantSlug = tenantSlug;
    this.roles = roles;
  }

  public UUID getUserId() {
    return userId;
  }

  public UUID getTenantId() {
    return tenantId;
  }

  public String getTenantSlug() {
    return tenantSlug;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return roles.stream()
        .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
        .map(SimpleGrantedAuthority::new)
        .collect(Collectors.toList());
  }

  @Override
  public String getPassword() {
    return "";
  }

  @Override
  public String getUsername() {
    return email;
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return true;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return true;
  }
}
