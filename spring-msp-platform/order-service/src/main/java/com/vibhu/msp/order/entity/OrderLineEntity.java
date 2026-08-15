package com.vibhu.msp.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "order_lines")
public class OrderLineEntity {

  @Id private String id;

  @Column(name = "order_id", nullable = false)
  private String orderId;

  @Column(nullable = false)
  private String sku;

  @Column(nullable = false)
  private int quantity;

  @Column(name = "unit_price", nullable = false)
  private java.math.BigDecimal unitPrice;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getOrderId() {
    return orderId;
  }

  public void setOrderId(String orderId) {
    this.orderId = orderId;
  }

  public String getSku() {
    return sku;
  }

  public void setSku(String sku) {
    this.sku = sku;
  }

  public int getQuantity() {
    return quantity;
  }

  public void setQuantity(int quantity) {
    this.quantity = quantity;
  }

  public java.math.BigDecimal getUnitPrice() {
    return unitPrice;
  }

  public void setUnitPrice(java.math.BigDecimal unitPrice) {
    this.unitPrice = unitPrice;
  }
}
