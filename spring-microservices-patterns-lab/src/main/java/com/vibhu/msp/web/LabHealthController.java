package com.vibhu.msp.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/lab")
public class LabHealthController {

  @GetMapping("/health")
  public Map<String, String> health() {
    return Map.of("status", "UP", "lab", "spring-microservices-patterns-lab");
  }
}
