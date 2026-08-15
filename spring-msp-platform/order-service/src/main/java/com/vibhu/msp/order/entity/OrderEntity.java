package com.vibhu.msp.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "orders")
public class OrderEntity {

  @Id
  private String id;

  @Column(name = "customer_id", nullable = false)
  private String customerId;

  @Column(name = "total_amount", nullable = false)
  private BigDecimal totalAmount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private OrderStatus status;

  @Column(name = "idempotency_key", unique = true)
  private String idempotencyKey;

  @Column(name = "correlation_id")
  private String correlationId;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "payment_authorized", nullable = false)
  private boolean paymentAuthorized = false;

  @Column(name = "inventory_reserved", nullable = false)
  private boolean inventoryReserved = false;

  public enum OrderStatus {
    PENDING, PAYMENT_PENDING, COMPLETED, CANCELLED
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getCustomerId() {
    return customerId;
  }

  public void setCustomerId(String customerId) {
    this.customerId = customerId;
  }

  public BigDecimal getTotalAmount() {
    return totalAmount;
  }

  public void setTotalAmount(BigDecimal totalAmount) {
    this.totalAmount = totalAmount;
  }

  public OrderStatus getStatus() {
    return status;
  }

  public void setStatus(OrderStatus status) {
    this.status = status;
  }

  public String getIdempotencyKey() {
    return idempotencyKey;
  }

  public void setIdempotencyKey(String idempotencyKey) {
    this.idempotencyKey = idempotencyKey;
  }

  public String getCorrelationId() {
    return correlationId;
  }

  public void setCorrelationId(String correlationId) {
    this.correlationId = correlationId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public boolean isPaymentAuthorized() {
    return paymentAuthorized;
  }

  public void setPaymentAuthorized(boolean paymentAuthorized) {
    this.paymentAuthorized = paymentAuthorized;
  }

  public boolean isInventoryReserved() {
    return inventoryReserved;
  }

  public void setInventoryReserved(boolean inventoryReserved) {
    this.inventoryReserved = inventoryReserved;
  }
}
