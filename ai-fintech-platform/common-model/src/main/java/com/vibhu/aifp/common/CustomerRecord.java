package com.vibhu.aifp.common;

public record CustomerRecord(
    String customerId, String name, String email, String segment, String riskTier) {}
