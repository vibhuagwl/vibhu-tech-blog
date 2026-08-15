package com.vibhu.security.audit.api;

import com.vibhu.security.audit.store.PiiAccessAuditEntity;
import com.vibhu.security.pii.common.audit.PiiAccessEventRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/audit")
public class AuditController {

  private final AuditService auditService;

  public AuditController(AuditService auditService) {
    this.auditService = auditService;
  }

  @PostMapping("/pii-access")
  @PreAuthorize("hasRole('SERVICE')")
  public ResponseEntity<Map<String, String>> record(
      @Valid @RequestBody PiiAccessEventRequest event) {
    auditService.record(event);
    return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "recorded"));
  }

  @GetMapping("/customers/{customerId}")
  @PreAuthorize("hasRole('COMPLIANCE')")
  public List<PiiAccessAuditEntity> history(@PathVariable UUID customerId) {
    return auditService.findByCustomer(customerId);
  }
}
