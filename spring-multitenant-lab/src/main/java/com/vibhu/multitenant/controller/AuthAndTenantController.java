package com.vibhu.multitenant.controller;

import com.vibhu.multitenant.common.DatabaseStrategy;
import com.vibhu.multitenant.common.TenantStatus;
import com.vibhu.multitenant.security.JwtService;
import com.vibhu.multitenant.tenant.TenantEntity;
import com.vibhu.multitenant.tenant.TenantRepository;
import com.vibhu.multitenant.tenant.service.TenantProvisioningService;
import com.vibhu.multitenant.user.UserEntity;
import com.vibhu.multitenant.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthAndTenantController {

  private final TenantRepository tenants;
  private final UserRepository users;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final TenantProvisioningService provisioning;

  public AuthAndTenantController(
      TenantRepository tenants,
      UserRepository users,
      PasswordEncoder passwordEncoder,
      JwtService jwtService,
      TenantProvisioningService provisioning) {
    this.tenants = tenants;
    this.users = users;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.provisioning = provisioning;
  }

  public record LoginRequest(
      @NotBlank String tenantSlug, @Email String email, @NotBlank String password) {}

  public record ProvisionRequest(
      @NotBlank String name,
      String plan,
      @Email String adminEmail,
      @NotBlank String adminPassword) {}

  public record TenantResponse(
      UUID id,
      String slug,
      String name,
      String plan,
      TenantStatus status,
      DatabaseStrategy databaseStrategy,
      String region,
      Instant createdAt) {}

  @PostMapping("/auth/login")
  public Map<String, Object> login(@Valid @RequestBody LoginRequest request) {
    TenantEntity tenant =
        tenants
            .findBySlug(request.tenantSlug().toLowerCase())
            .orElseThrow(
                () ->
                    new com.vibhu.multitenant.exception.MultiTenantException(
                        "tenant_unknown", "Unknown tenant", 404));
    UserEntity user =
        users
            .findByTenantIdAndEmail(tenant.getId(), request.email().toLowerCase())
            .orElseThrow(
                () ->
                    new com.vibhu.multitenant.exception.MultiTenantException(
                        "auth_failed", "Invalid credentials", 401));
    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new com.vibhu.multitenant.exception.MultiTenantException(
          "auth_failed", "Invalid credentials", 401);
    }
    List<String> roles = Arrays.asList(user.getRoles().split(","));
    String token =
        jwtService.issue(user.getId(), user.getEmail(), tenant.getId(), tenant.getSlug(), roles);
    return Map.of(
        "accessToken",
        token,
        "tenantId",
        tenant.getId().toString(),
        "tenantSlug",
        tenant.getSlug(),
        "userId",
        user.getId().toString());
  }

  @PostMapping("/tenants")
  public TenantResponse provision(@Valid @RequestBody ProvisionRequest request) {
    TenantEntity tenant =
        provisioning.provision(
            request.name(), request.plan(), request.adminEmail(), request.adminPassword());
    return toResponse(tenant);
  }

  @GetMapping("/tenants/{id}")
  public TenantResponse get(@PathVariable UUID id) {
    return tenants
        .findById(id)
        .map(this::toResponse)
        .orElseThrow(
            () ->
                new com.vibhu.multitenant.exception.MultiTenantException(
                    "tenant_unknown", "Unknown tenant", 404));
  }

  @PostMapping("/tenants/{id}/retry-provisioning")
  public TenantResponse retry(@PathVariable UUID id) {
    return toResponse(provisioning.retry(id));
  }

  private TenantResponse toResponse(TenantEntity tenant) {
    return new TenantResponse(
        tenant.getId(),
        tenant.getSlug(),
        tenant.getName(),
        tenant.getPlan(),
        tenant.getStatus(),
        tenant.getDatabaseStrategy(),
        tenant.getRegion(),
        tenant.getCreatedAt());
  }
}
