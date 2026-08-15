package com.vibhu.security.attacks.ddos;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ddos")
public class DdosController {

  @GetMapping("/ping")
  public Map<String, Object> ping() {
    return Map.of(
        "ok",
        true,
        "message",
        "Healthy. Burst this endpoint to see HTTP 429 from IpRateLimitFilter.");
  }
}
