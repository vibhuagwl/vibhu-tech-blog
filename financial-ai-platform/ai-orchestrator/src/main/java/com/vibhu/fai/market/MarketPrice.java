package com.vibhu.fai.market;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "market_prices")
public class MarketPrice {
  @Id private String symbol;
  private BigDecimal price;
  private Instant asOf;

  public MarketPrice() {}

  public MarketPrice(String symbol, BigDecimal price, Instant asOf) {
    this.symbol = symbol;
    this.price = price;
    this.asOf = asOf;
  }

  public String getSymbol() { return symbol; }
  public BigDecimal getPrice() { return price; }
  public Instant getAsOf() { return asOf; }
}
