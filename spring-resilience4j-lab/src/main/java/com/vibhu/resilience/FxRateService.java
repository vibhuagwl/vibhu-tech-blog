package com.vibhu.resilience;

import java.math.BigDecimal;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class FxRateService {
    private final AtomicInteger bankHits = new AtomicInteger();

    @Cacheable("fxRates")
    public BigDecimal usdInr() {
        bankHits.incrementAndGet();
        return new BigDecimal("83.25");
    }

    public int bankHits() {
        return bankHits.get();
    }
}
