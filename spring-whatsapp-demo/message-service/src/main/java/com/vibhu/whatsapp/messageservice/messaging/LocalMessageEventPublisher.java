package com.vibhu.whatsapp.messageservice.messaging;

import com.vibhu.whatsapp.common.events.MessageCreatedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!kafka")
public class LocalMessageEventPublisher implements MessageEventPublisher {
  private final ApplicationEventPublisher eventPublisher;

  public LocalMessageEventPublisher(ApplicationEventPublisher eventPublisher) {
    this.eventPublisher = eventPublisher;
  }

  @Override
  public void publish(MessageCreatedEvent event) {
    eventPublisher.publishEvent(event);
  }
}
