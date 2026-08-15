package com.vibhu.security.idanywhere.api.admin;

import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

  @GetMapping("/stats")
  @PreAuthorize("hasRole('ADMIN')")
  public Map<String, Object> stats() {
    return Map.of("status", "ok", "source", "idanywhere-groups");
  }
}
