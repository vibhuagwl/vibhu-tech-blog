package com.vibhu.msp.notification;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

import com.vibhu.msp.notification.repository.NotificationRepository;
import com.vibhu.msp.notification.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class NotificationServiceUnitTest {

  @Test
  void persistsNotification() {
    NotificationRepository repo = Mockito.mock(NotificationRepository.class);
    NotificationService service = new NotificationService(repo);
    service.send("ord-1", "test message");
    verify(repo).save(any());
  }
}
