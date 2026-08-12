package com.vibhu.kafka.common;

public final class PaymentKeyStrategy {

    private PaymentKeyStrategy() {
    }

    public static String forPayment(String accountId, String paymentId) {
        return accountId + ":" + paymentId;
    }
}
