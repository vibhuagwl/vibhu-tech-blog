package com.vibhu.security.support.customer;

import com.vibhu.security.pii.common.dto.CreateCustomerRequest;
import com.vibhu.security.pii.common.dto.CustomerRecord;
import com.vibhu.security.pii.common.dto.CustomerView;
import com.vibhu.security.pii.common.masking.PiiMasking;
import com.vibhu.security.pii.common.secrets.SecretSanitizer;
import com.vibhu.security.support.client.AuditServiceClient;
import com.vibhu.security.support.client.CustomerServiceClient;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;

@Service
public class SupportCustomerService {

  private static final Logger log = LoggerFactory.getLogger(SupportCustomerService.class);

  private final CustomerServiceClient customerClient;
  private final AuditServiceClient auditClient;

  public SupportCustomerService(
      CustomerServiceClient customerClient, AuditServiceClient auditClient) {
    this.customerClient = customerClient;
    this.auditClient = auditClient;
  }

  public CustomerView create(CreateCustomerRequest request) {
    CustomerRecord created = customerClient.create(request);
    log.info("Support created customer id={} actor={}", created.id(), currentUsername());
    return toView(created, true);
  }

  public CustomerView get(UUID id, boolean fullPii, HttpServletRequest httpRequest) {
    if (fullPii && !currentUserHasPiiAdmin()) {
      throw new PiiAccessDeniedException("fullPii requires ROLE_PII_ADMIN");
    }

    CustomerRecord record;
    try {
      record = customerClient.get(id);
    } catch (HttpClientErrorException.NotFound ex) {
      throw new CustomerNotFoundException(id);
    }

    boolean mask = !fullPii;
    auditClient.recordPiiAccess(currentUsername(), id, fullPii, clientIp(httpRequest));

    log.info(
        "Support read customer id={} masked={} actor={}",
        id,
        mask,
        SecretSanitizer.redact(currentUsername()));

    return toView(record, mask);
  }

  CustomerView toView(CustomerRecord record, boolean masked) {
    String email = record.email();
    String ssn = record.ssn();
    if (masked) {
      email = PiiMasking.maskEmail(email);
      ssn = PiiMasking.maskSsn(ssn);
    }
    return new CustomerView(
        record.id(),
        record.fullName(),
        email,
        ssn,
        PiiMasking.maskPanLast4(record.panLast4()),
        masked,
        record.createdAt());
  }

  private boolean currentUserHasPiiAdmin() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) {
      return false;
    }
    return auth.getAuthorities().stream().anyMatch(a -> "ROLE_PII_ADMIN".equals(a.getAuthority()));
  }

  private String currentUsername() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    return auth == null ? "anonymous" : auth.getName();
  }

  private String clientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }
}
