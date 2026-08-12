package com.vibhu.kafka.common;

public final class PaymentTopics {

    public static final String PAYMENT_REQUESTS = "payment.requested.v1";
    public static final String PAYMENT_RESULTS = "payment.results.v1";
    public static final String PAYMENT_REQUESTS_DLT = "payment.requested.v1.DLT";

    private PaymentTopics() {
    }
}
