package com.vibhu.multitenant.controller;

import com.vibhu.multitenant.kafka.DeadLetterStore;
import com.vibhu.multitenant.kafka.OutboxPublisher;
import com.vibhu.multitenant.security.JwtService;
import com.vibhu.multitenant.tenant.TenantEntity;
import com.vibhu.multitenant.tenant.TenantRepository;
import com.vibhu.multitenant.user.UserEntity;
import com.vibhu.multitenant.user.UserRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Lab-only helpers: mint JWT without password and inspect DLQ. */
@RestController
@RequestMapping("/api/lab")
public class LabController {

  private final TenantRepository tenants;
  private final UserRepository users;
  private final JwtService jwtService;
  private final DeadLetterStore dlq;
  private final OutboxPublisher.TenantOrderConsumer consumer;
  private final com.vibhu.multitenant.kafka.TenantEventBus bus;

  public LabController(
      TenantRepository tenants,
      UserRepository users,
      JwtService jwtService,
      DeadLetterStore dlq,
      OutboxPublisher.TenantOrderConsumer consumer,
      com.vibhu.multitenant.kafka.TenantEventBus bus) {
    this.tenants = tenants;
    this.users = users;
    this.jwtService = jwtService;
    this.dlq = dlq;
    this.consumer = consumer;
    this.bus = bus;
  }

  @PostMapping("/token")
  public Map<String, String> token(@RequestParam String tenantSlug) {
    TenantEntity tenant =
        tenants
            .findBySlug(tenantSlug.toLowerCase())
            .orElseThrow(() -> new IllegalArgumentException("unknown tenant"));
    UserEntity user =
        users.findAll().stream()
            .filter(u -> u.getTenantId().equals(tenant.getId()))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("no user"));
    List<String> roles = Arrays.asList(user.getRoles().split(","));
    String token =
        jwtService.issue(user.getId(), user.getEmail(), tenant.getId(), tenant.getSlug(), roles);
    return Map.of("accessToken", token, "tenantSlug", tenant.getSlug(), "email", user.getEmail());
  }

  @GetMapping("/dlq")
  public List<DeadLetterStore.DlqRecord> listDlq() {
    return dlq.list();
  }

  @PostMapping("/dlq/{id}/replay")
  public DeadLetterStore.DlqRecord replay(@PathVariable UUID id) {
    return dlq.replay(id, bus);
  }

  @GetMapping("/consumed-events")
  public List<String> consumed() {
    return consumer.consumedEventIds();
  }
}
