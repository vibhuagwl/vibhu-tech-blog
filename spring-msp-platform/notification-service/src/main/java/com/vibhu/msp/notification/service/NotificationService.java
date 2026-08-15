package com.vibhu.msp.notification.service;

import com.vibhu.msp.notification.entity.NotificationEntity;
import com.vibhu.msp.notification.repository.NotificationRepository;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

  private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

  private final NotificationRepository notificationRepository;

  public NotificationService(NotificationRepository notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  @Transactional
  public void send(String orderId, String message) {
    NotificationEntity notification = new NotificationEntity();
    notification.setId(UUID.randomUUID().toString());
    notification.setOrderId(orderId);
    notification.setChannel("email");
    notification.setMessage(message);
    notification.setCreatedAt(Instant.now());
    notificationRepository.save(notification);
    log.info("Notification sent orderId={} message={}", orderId, message);
  }
}
