package com.example.designpatterns.structural.flyweight;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CurrencyFlyweightDemo {
    public record CurrencyMetadata(String code, String symbol) {}
    public static final class CurrencyFactory {
        private final Map<String, CurrencyMetadata> cache = new ConcurrentHashMap<>();
        public CurrencyMetadata get(String code){ return cache.computeIfAbsent(code, c -> new CurrencyMetadata(c, switch(c){ case "USD" -> "$"; case "INR" -> "₹"; default -> c; })); }
        public int size(){ return cache.size(); }
    }
}
