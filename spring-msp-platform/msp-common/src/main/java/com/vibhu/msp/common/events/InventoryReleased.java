package com.vibhu.msp.common.events;

public record InventoryReleased(
    String orderId,
    String reservationId,
    String reason
) {}
