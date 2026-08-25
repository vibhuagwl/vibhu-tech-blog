package com.vibhu.fai.common.dto;

import java.math.BigDecimal;

public record PositionView(
    String symbol,
    BigDecimal quantity,
    BigDecimal avgCost,
    BigDecimal lastPrice,
    BigDecimal marketValue,
    BigDecimal unrealizedPnl) {}
