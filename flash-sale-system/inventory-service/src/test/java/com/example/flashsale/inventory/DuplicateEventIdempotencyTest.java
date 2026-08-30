package com.example.flashsale.inventory;

import com.example.flashsale.common.event.EventEnvelope;
import com.example.flashsale.inventory.application.ReserveInventoryService;
import com.example.flashsale.inventory.domain.model.Inventory;
import com.example.flashsale.inventory.domain.repository.InventoryRepository;
import com.example.flashsale.inventory.domain.repository.InventoryReservationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class DuplicateEventIdempotencyTest {

    @Autowired
    ReserveInventoryService service;

    @Autowired
    InventoryRepository inventoryRepository;

    @Autowired
    InventoryReservationRepository reservations;

    @Test
    void sameEventId_doesNotDoubleReserve() {
        inventoryRepository.save(new Inventory("P-DUP", 5));
        EventEnvelope env = EventEnvelope.of(
                "OrderRequested",
                "c",
                "ord-dup",
                "P-DUP",
                Map.of("orderId", "ord-dup", "productId", "P-DUP", "quantity", 1));
        assertThat(service.reserve(env)).isTrue();
        assertThat(service.reserve(env)).isTrue();
        assertThat(reservations.findByOrderId("ord-dup")).isPresent();
        assertThat(inventoryRepository.findById("P-DUP")
                .orElseThrow()
                .getAvailableQuantity()).isEqualTo(4);
    }
}
