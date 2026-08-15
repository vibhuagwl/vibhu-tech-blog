package com.vibhu.ratelimit.web;

import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DemoController {

  @PostMapping("/payments")
  public Map<String, Object> pay() {
    return Map.of(
        "status", "accepted",
        "at", Instant.now().toString(),
        "note", "Would publish to Kafka and write the payment DB after the rate-limit filter.");
  }

  @GetMapping("/public/ping")
  public Map<String, String> ping() {
    return Map.of("pong", Instant.now().toString());
  }

  @GetMapping("/internal/work")
  public Map<String, String> internal() {
    return Map.of("worker", "ok");
  }
}
