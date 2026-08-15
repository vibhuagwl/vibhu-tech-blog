package com.vibhu.lock.common;

import java.math.BigDecimal;

public record AccountView(String accountId, BigDecimal balance, long version, String status) {}
