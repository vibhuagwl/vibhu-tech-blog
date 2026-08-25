package com.vibhu.cache.product;

import java.math.BigDecimal;

public record Product(Long id, String name, BigDecimal price, String category) {}
