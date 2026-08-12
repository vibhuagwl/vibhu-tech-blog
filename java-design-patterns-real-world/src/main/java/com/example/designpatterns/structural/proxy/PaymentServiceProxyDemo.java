package com.example.designpatterns.structural.proxy;

import java.util.HashMap;
import java.util.Map;

public class PaymentServiceProxyDemo {
    public interface PaymentService { String fetchStatus(String paymentId, String token); }
    public static final class RealPaymentService implements PaymentService { public String fetchStatus(String paymentId, String token){ return "SETTLED:" + paymentId; } }
    public static final class PaymentServiceProxy implements PaymentService {
        private final PaymentService delegate; private final Map<String, String> cache = new HashMap<>();
        public PaymentServiceProxy(PaymentService delegate){ this.delegate = delegate; }
        public String fetchStatus(String paymentId, String token){
            if (!"ALLOW".equals(token)) throw new SecurityException("unauthorized");
            return cache.computeIfAbsent(paymentId, id -> delegate.fetchStatus(id, token));
        }
    }
}
