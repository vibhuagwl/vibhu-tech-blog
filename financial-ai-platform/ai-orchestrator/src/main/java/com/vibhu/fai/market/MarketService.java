package com.vibhu.fai.market;

import java.math.BigDecimal;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class MarketService {
  private final MarketPriceRepository repo;

  public MarketService(MarketPriceRepository repo) {
    this.repo = repo;
  }

  @Cacheable(cacheNames = "prices", key = "#symbol", sync = true)
  public BigDecimal getPrice(String symbol) {
    return repo.findById(symbol)
        .map(MarketPrice::getPrice)
        .orElseThrow(() -> new IllegalArgumentException("Unknown symbol " + symbol));
  }
}
