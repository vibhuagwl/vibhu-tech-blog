package com.vibhu.gateway.live.user;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Downstream User Service.
 * Phase 3: {@code instance} + {@code port} prove which replica handled the call.
 */
@RestController
@RequestMapping("/users")
public class UserController {

  @Value("${INSTANCE_ID:user-1}")
  private String instanceId;

  @Value("${server.port}")
  private int port;

  @GetMapping("/{id}")
  public Map<String, Object> getUser(
      @PathVariable long id,
      @RequestHeader(value = "X-Correlation-ID", required = false) String correlationId) {
    if (id <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id must be positive");
    }
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("service", "user-service");
    body.put("instance", instanceId);
    body.put("port", port);
    body.put("id", id);
    body.put("name", "User-" + id);
    body.put("correlationId", correlationId == null ? "" : correlationId);
    return body;
  }

  @GetMapping
  public Map<String, Object> list() {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("service", "user-service");
    body.put("instance", instanceId);
    body.put("port", port);
    body.put(
        "users",
        List.of(
            Map.of("id", 101, "name", "User-101"),
            Map.of("id", 102, "name", "User-102")));
    return body;
  }
}
