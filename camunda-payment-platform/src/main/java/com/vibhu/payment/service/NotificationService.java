package com.vibhu.payment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
  private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

  public void notifyCustomer(String paymentId, String status) {
    // Never log PAN / full account — paymentId + status only.
    log.info("notification queued paymentId={} status={}", paymentId, status);
  }

  public void escalateApproval(String paymentId) {
    log.warn("approval escalated paymentId={}", paymentId);
  }
}
