package com.vibhu.security.support.client;

import com.vibhu.security.pii.common.audit.PiiAccessEventRequest;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AuditServiceClient {

  private static final Logger log = LoggerFactory.getLogger(AuditServiceClient.class);

  private final RestClient restClient;

  public AuditServiceClient(@Qualifier("auditServiceRestClient") RestClient restClient) {
    this.restClient = restClient;
  }

  public void recordPiiAccess(
      String actor, UUID customerId, boolean fullPiiGranted, String clientIp) {
    PiiAccessEventRequest event =
        new PiiAccessEventRequest(
            Instant.now(),
            actor,
            "support-api",
            "READ_CUSTOMER",
            customerId,
            fullPiiGranted,
            clientIp);

    try {
      restClient.post().uri("/internal/audit/pii-access").body(event).retrieve().toBodilessEntity();
    } catch (Exception ex) {
      // Audit failure must not block support workflow — alert in prod
      log.error("Failed to ship PII audit event customerId={} actor={}", customerId, actor, ex);
    }
  }
}
