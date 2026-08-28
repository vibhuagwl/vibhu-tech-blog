package com.vibhu.security.resource.payment;

import java.math.BigDecimal;
import java.util.UUID;

public record Payment(UUID id, String fromAccount, String toAccount, BigDecimal amount, String currency,
                      String status) {
}
