package com.vibhu.security.resource.admin;

import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

  @GetMapping("/reports")
  @PreAuthorize("hasRole('ADMIN') and hasAuthority('SCOPE_report.read')")
  public Map<String, Object> reports() {
    return Map.of(
        "report", "daily-settlement",
        "status", "OK",
        "note", "Requires ROLE_ADMIN + SCOPE_report.read");
  }
}
