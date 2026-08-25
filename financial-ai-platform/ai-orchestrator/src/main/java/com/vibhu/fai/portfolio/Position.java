package com.vibhu.fai.portfolio;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "positions")
public class Position {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String portfolioId;
  private String symbol;
  private BigDecimal quantity;
  private BigDecimal avgCost;
  private String tenantId;

  public Position() {}

  public Position(String portfolioId, String symbol, BigDecimal quantity, BigDecimal avgCost, String tenantId) {
    this.portfolioId = portfolioId;
    this.symbol = symbol;
    this.quantity = quantity;
    this.avgCost = avgCost;
    this.tenantId = tenantId;
  }

  public Long getId() { return id; }
  public String getPortfolioId() { return portfolioId; }
  public String getSymbol() { return symbol; }
  public BigDecimal getQuantity() { return quantity; }
  public BigDecimal getAvgCost() { return avgCost; }
  public String getTenantId() { return tenantId; }
}
