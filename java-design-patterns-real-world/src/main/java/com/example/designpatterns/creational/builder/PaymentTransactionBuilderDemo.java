package com.example.designpatterns.creational.builder;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

public class PaymentTransactionBuilderDemo {
    public record PaymentTransaction(String transactionId, String customerId, BigDecimal amount, String currency,
                                     Map<String, String> metadata, String retryPolicy, boolean fraudCheck, String callbackUrl) {}
    public static final class Builder {
        private String transactionId; private String customerId; private BigDecimal amount; private String currency;
        private final Map<String, String> metadata = new HashMap<>();
        private String retryPolicy = "NONE"; private boolean fraudCheck = true; private String callbackUrl = "";
        public Builder transactionId(String v){ transactionId=v; return this; }
        public Builder customerId(String v){ customerId=v; return this; }
        public Builder amount(BigDecimal v){ amount=v; return this; }
        public Builder currency(String v){ currency=v; return this; }
        public Builder metadata(String k, String v){ metadata.put(k,v); return this; }
        public Builder retryPolicy(String v){ retryPolicy=v; return this; }
        public Builder fraudCheck(boolean v){ fraudCheck=v; return this; }
        public Builder callbackUrl(String v){ callbackUrl=v; return this; }
        public PaymentTransaction build(){ return new PaymentTransaction(transactionId, customerId, amount, currency, Map.copyOf(metadata), retryPolicy, fraudCheck, callbackUrl); }
    }
}
