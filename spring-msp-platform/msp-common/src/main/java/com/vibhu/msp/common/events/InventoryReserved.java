package com.vibhu.msp.common.events;

public record InventoryReserved(
    String orderId,
    String reservationId
) {}
