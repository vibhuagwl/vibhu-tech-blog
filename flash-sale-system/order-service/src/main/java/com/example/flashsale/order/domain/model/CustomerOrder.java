package com.example.flashsale.order.domain.model;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "orders")
public class CustomerOrder {
    @Id
    @Column(name = "order_id")
    private String orderId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "flash_sale_id", nullable = false)
    private String flashSaleId;

    @Column(name = "product_id", nullable = false)
    private String productId;

    private int quantity;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    /**
     * WHY: concurrent PaymentSucceeded vs user-cancel must not both win. The loser retries and
     * sees a terminal state.
     */
    @Version
    private Long version;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    protected CustomerOrder() {
    }

    public static CustomerOrder pending(String orderId, String userId, String saleId, String productId, int qty) {
        CustomerOrder o = new CustomerOrder();
        o.orderId = orderId;
        o.userId = userId;
        o.flashSaleId = saleId;
        o.productId = productId;
        o.quantity = qty;
        o.status = OrderStatus.PENDING;
        return o;
    }

    public String getOrderId() {
        return orderId;
    }

    public String getUserId() {
        return userId;
    }

    public String getFlashSaleId() {
        return flashSaleId;
    }

    public String getProductId() {
        return productId;
    }

    public int getQuantity() {
        return quantity;
    }

    public OrderStatus getStatus() {
        return status;
    }

    /**
     * @return true if this call moved PENDING → CONFIRMED. Cancelled orders stay cancelled.
     */
    public boolean confirm() {
        if (status != OrderStatus.PENDING) {
            return false;
        }
        this.status = OrderStatus.CONFIRMED;
        this.updatedAt = Instant.now();
        return true;
    }

    /**
     * @return true if the order is CANCELLED afterwards. Confirmed orders cannot be undone here.
     */
    public boolean cancel() {
        if (status == OrderStatus.CANCELLED) {
            return true;
        }
        if (status != OrderStatus.PENDING) {
            return false;
        }
        this.status = OrderStatus.CANCELLED;
        this.updatedAt = Instant.now();
        return true;
    }
}
