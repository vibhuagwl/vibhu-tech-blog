package com.vibhu.msp.acl;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * Anti-Corruption Layer — translates legacy monolith models into the new domain vocabulary.
 * Maps to curriculum Part 01 (ACL / branch-by-abstraction).
 */
public final class AntiCorruptionLayer {

    /** Legacy monolith row shape (ugly, wide table). */
    public record LegacyOrderRow(
            long orderId,
            String custName,
            String custEmail,
            double totalAmt,
            String statusCode,
            long createdEpoch) {}

    /** Clean domain model consumed by microservices. */
    public record OrderPlaced(
            String orderId,
            CustomerRef customer,
            Money total,
            OrderStatus status,
            Instant placedAt) {}

    public record CustomerRef(String id, String displayName, String email) {}

    public record Money(String currency, BigDecimal amount) {}

    public enum OrderStatus { PENDING, CONFIRMED, SHIPPED, CANCELLED }

    private static final Map<String, OrderStatus> STATUS_MAP = Map.of(
            "P", OrderStatus.PENDING,
            "C", OrderStatus.CONFIRMED,
            "S", OrderStatus.SHIPPED,
            "X", OrderStatus.CANCELLED
    );

    public OrderPlaced translate(LegacyOrderRow legacy) {
        OrderStatus status = STATUS_MAP.getOrDefault(legacy.statusCode(), OrderStatus.PENDING);
        return new OrderPlaced(
                "ORD-" + legacy.orderId(),
                new CustomerRef("CUST-" + legacy.orderId(), legacy.custName(), legacy.custEmail()),
                new Money("USD", BigDecimal.valueOf(legacy.totalAmt())),
                status,
                Instant.ofEpochSecond(legacy.createdEpoch())
        );
    }
}
