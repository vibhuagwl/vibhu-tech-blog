package com.vibhu.ratelimit.web;

import com.vibhu.ratelimit.api.RateLimitAlgorithm;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.limiter.LabPlaygroundService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/lab")
public class PlaygroundController {

  private final LabPlaygroundService playground;

  public PlaygroundController(LabPlaygroundService playground) {
    this.playground = playground;
  }

  @GetMapping("/algorithms")
  public List<Map<String, String>> algorithms() {
    return playground.algorithms();
  }

  @GetMapping("/{algorithm}")
  public Map<String, Object> tryAllow(
      @PathVariable String algorithm,
      @RequestHeader(value = "X-Lab-Key", required = false) String labKey,
      @RequestParam(defaultValue = "1") double cost) {
    if (labKey == null || labKey.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-Lab-Key header is required");
    }
    RateLimitAlgorithm algo = parseAlgorithm(algorithm);
    RateLimitResult result = playground.tryAllow(algo, labKey.trim(), cost);
    return Map.of(
        "algorithm", algo.name(),
        "labKey", labKey.trim(),
        "cost", cost,
        "allowed", result.allowed(),
        "remaining", result.remainingTokens(),
        "limit", result.limit(),
        "retryAfterSeconds", result.retryAfterSeconds(),
        "reason", result.reason());
  }

  private static RateLimitAlgorithm parseAlgorithm(String raw) {
    try {
      return RateLimitAlgorithm.valueOf(raw.trim().toUpperCase());
    } catch (IllegalArgumentException ex) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Unknown algorithm: " + raw + ". Use GET /api/lab/algorithms");
    }
  }
}
