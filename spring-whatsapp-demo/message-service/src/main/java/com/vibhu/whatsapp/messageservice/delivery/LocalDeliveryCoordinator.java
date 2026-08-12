package com.vibhu.whatsapp.messageservice.delivery;

import com.vibhu.whatsapp.common.dto.DeliveryAttemptStatus;
import com.vibhu.whatsapp.common.dto.PresenceView;
import com.vibhu.whatsapp.common.events.MessageCreatedEvent;
import com.vibhu.whatsapp.messageservice.presence.PresenceStore;
import com.vibhu.whatsapp.messageservice.store.DeliveryAttemptRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
@Profile("!kafka")
public class LocalDeliveryCoordinator {
    private final PresenceStore presenceStore;
    private final DeliveryAttemptRepository deliveryAttemptRepository;
    private final ConcurrentMap<String, CopyOnWriteArrayList<MessageCreatedEvent>> pendingByRecipient =
            new ConcurrentHashMap<>();

    public LocalDeliveryCoordinator(PresenceStore presenceStore, DeliveryAttemptRepository deliveryAttemptRepository) {
        this.presenceStore = presenceStore;
        this.deliveryAttemptRepository = deliveryAttemptRepository;
    }

    @EventListener
    public void onMessageCreated(MessageCreatedEvent event) {
        PresenceView presence = presenceStore.find(event.recipientId());
        if (presence.online()) {
            recordDelivered(event, presence);
            return;
        }

        pendingByRecipient
                .computeIfAbsent(event.recipientId(), ignored -> new CopyOnWriteArrayList<>())
                .add(event);
        deliveryAttemptRepository.record(
                event.serverMsgId(),
                event.recipientId(),
                null,
                null,
                DeliveryAttemptStatus.PENDING_OFFLINE
        );
    }

    public void deliverPendingFor(String userId) {
        List<MessageCreatedEvent> pending = pendingByRecipient.remove(userId);
        if (pending == null || pending.isEmpty()) {
            return;
        }
        PresenceView presence = presenceStore.find(userId);
        if (!presence.online()) {
            pendingByRecipient.computeIfAbsent(userId, ignored -> new CopyOnWriteArrayList<>()).addAll(pending);
            return;
        }
        pending.forEach(event -> recordDelivered(event, presence));
    }

    private void recordDelivered(MessageCreatedEvent event, PresenceView presence) {
        deliveryAttemptRepository.record(
                event.serverMsgId(),
                event.recipientId(),
                presence.deviceId(),
                presence.gatewayNode(),
                DeliveryAttemptStatus.DELIVERED
        );
    }
}
