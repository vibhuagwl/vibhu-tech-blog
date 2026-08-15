package com.vibhu.security.cors.web;

import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApiController {

  @GetMapping("/public/ping")
  public Map<String, String> publicPing() {
    return Map.of("status", "ok", "scope", "public");
  }

  @GetMapping("/accounts/me")
  public ResponseEntity<Map<String, Object>> me() {
    return ResponseEntity.ok()
        .header("X-Request-Id", UUID.randomUUID().toString())
        .body(
            Map.of(
                "username", "alice",
                "balance", 10_000,
                "currency", "INR"));
  }

  @PostMapping("/transfers")
  public Map<String, Object> transfer(@RequestBody TransferRequest request) {
    return Map.of(
        "status", "ACCEPTED",
        "toAccount", request.toAccount(),
        "amount", request.amount());
  }

  public record TransferRequest(String toAccount, int amount) {}
}
