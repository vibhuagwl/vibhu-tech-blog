package com.vibhu.msp.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "stock")
public class StockEntity {
  @Id private String sku;
  @Column(nullable = false) private int available;
  public String getSku() { return sku; }
  public void setSku(String sku) { this.sku = sku; }
  public int getAvailable() { return available; }
  public void setAvailable(int available) { this.available = available; }
}
