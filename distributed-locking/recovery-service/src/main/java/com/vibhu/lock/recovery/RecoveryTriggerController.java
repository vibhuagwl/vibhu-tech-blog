package com.vibhu.lock.recovery;

import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@RestController
@RequestMapping("/api/v1/recovery")
public class RecoveryTriggerController {
  private final RestClient restClient;
  private final RecoveryProperties properties;

  public RecoveryTriggerController(RestClient transactionServiceRestClient, RecoveryProperties properties) {
    this.restClient = transactionServiceRestClient;
    this.properties = properties;
  }

  @PostMapping("/run")
  public Map<?, ?> run() {
    return restClient.post()
        .uri(uriBuilder -> uriBuilder
            .path("/internal/recovery/run")
            .queryParam("staleSeconds", properties.getStaleSeconds())
            .build())
        .retrieve()
        .body(Map.class);
  }
}
