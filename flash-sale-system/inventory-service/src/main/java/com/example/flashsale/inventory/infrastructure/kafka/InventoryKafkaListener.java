package com.example.flashsale.inventory.infrastructure.kafka;

import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.common.event.JsonEvents;
import com.example.flashsale.common.kafka.Topics;
import com.example.flashsale.inventory.application.ReserveInventoryService;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class InventoryKafkaListener {

    private final ReserveInventoryService reserveInventoryService;

    public InventoryKafkaListener(ReserveInventoryService reserveInventoryService) {
        this.reserveInventoryService = reserveInventoryService;
    }

    @KafkaListener(topics = Topics.ORDER_REQUESTED, groupId = "inventory-service")
    public void onOrderRequested(String json, Acknowledgment ack) {
        EventEnvelope env = JsonEvents.read(json);
        reserveInventoryService.reserve(env);
        ack.acknowledge();
    }

    @KafkaListener(topics = Topics.INVENTORY_RELEASE_REQUESTED, groupId = "inventory-service")
    public void onRelease(String json, Acknowledgment ack) {
        EventEnvelope env = JsonEvents.read(json);
        String orderId = String.valueOf(env.payload()
                .get("orderId"));
        reserveInventoryService.release(orderId, env.eventId());
        ack.acknowledge();
    }

    @KafkaListener(topics = Topics.ORDER_CONFIRMED, groupId = "inventory-service")
    public void onConfirmed(String json, Acknowledgment ack) {
        EventEnvelope env = JsonEvents.read(json);
        reserveInventoryService.confirm(String.valueOf(env.payload()
                .get("orderId")), env.eventId());
        ack.acknowledge();
    }
}
