package com.vibhu.lock.common;

import java.math.BigDecimal;
import java.time.Instant;

public record AccountView(
        String accountId,
        BigDecimal balance,
        long fencingToken,
        Instant updatedAt
) {
}
package com.vibhu.lock.common;

import java.math.BigDecimal;

public record AccountView(
    String accountId,
    BigDecimal balance,
    long version,
    String status
) {
}
