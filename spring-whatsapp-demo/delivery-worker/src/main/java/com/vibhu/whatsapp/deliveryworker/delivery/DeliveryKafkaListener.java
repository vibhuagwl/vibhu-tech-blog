package com.vibhu.whatsapp.deliveryworker.delivery;

import com.vibhu.whatsapp.common.dto.DeliveryAttemptStatus;
import com.vibhu.whatsapp.common.dto.PresenceView;
import com.vibhu.whatsapp.common.events.MessageCreatedEvent;
import com.vibhu.whatsapp.common.events.WhatsAppTopics;
import com.vibhu.whatsapp.deliveryworker.presence.PresenceLookup;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Profile("kafka")
public class DeliveryKafkaListener {
  private final PresenceLookup presenceLookup;
  private final WorkerDeliveryAttemptRepository deliveryAttemptRepository;

  public DeliveryKafkaListener(
      PresenceLookup presenceLookup, WorkerDeliveryAttemptRepository deliveryAttemptRepository) {
    this.presenceLookup = presenceLookup;
    this.deliveryAttemptRepository = deliveryAttemptRepository;
  }

  @KafkaListener(topics = WhatsAppTopics.MESSAGE_CREATED, groupId = "delivery-worker")
  public void onMessageCreated(MessageCreatedEvent event) {
    PresenceView presence = presenceLookup.find(event.recipientId());
    if (presence.online()) {
      deliveryAttemptRepository.record(
          event.serverMsgId(),
          event.recipientId(),
          presence.deviceId(),
          presence.gatewayNode(),
          DeliveryAttemptStatus.DELIVERED);
      return;
    }

    deliveryAttemptRepository.record(
        event.serverMsgId(),
        event.recipientId(),
        null,
        null,
        DeliveryAttemptStatus.PENDING_OFFLINE);
  }
}
