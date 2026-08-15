package com.example.designpatterns.structural.flyweight;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * PATTERN: Flyweight
 *
 * <p>WHEN TO IMPLEMENT - Huge numbers of similar objects share immutable intrinsic state (currency
 * metadata, glyph metrics). - Memory pressure from duplicating identical data.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Split intrinsic (shared, immutable) vs extrinsic (per-call
 * context) state. 2. Flyweight factory caches intrinsic instances (ConcurrentHashMap) keyed by
 * identity. 3. Flyweights must be immutable and thread-safe once published. 4. Pass extrinsic state
 * into methods; never store request-specific data on the shared flyweight. 5. Document cache
 * eviction policy if the key space is unbounded.
 *
 * <p>DO NOT USE WHEN - Object count is small — premature sharing adds complexity with no memory
 * win.
 */
public class CurrencyFlyweightDemo {
  public record CurrencyMetadata(String code, String symbol) {}

  public static final class CurrencyFactory {
    private final Map<String, CurrencyMetadata> cache = new ConcurrentHashMap<>();

    public CurrencyMetadata get(String code) {
      return cache.computeIfAbsent(
          code,
          c ->
              new CurrencyMetadata(
                  c,
                  switch (c) {
                    case "USD" -> "$";
                    case "INR" -> "₹";
                    default -> c;
                  }));
    }

    public int size() {
      return cache.size();
    }
  }

  public static void run() {
    System.out.println("=== Flyweight — CurrencyFlyweightDemo ===");
    System.out.println("STEP 1: Create CurrencyFactory with shared intrinsic metadata cache");
    var factory = new CurrencyFactory();
    System.out.println("STEP 2: Request USD and INR metadata multiple times");
    var usd1 = factory.get("USD");
    var usd2 = factory.get("USD");
    var inr = factory.get("INR");
    System.out.println("STEP 3: Same code returns shared flyweight instance; cache stays small");
    System.out.println("  USD symbol: " + usd1.symbol() + ", same instance? " + (usd1 == usd2));
    System.out.println("  INR symbol: " + inr.symbol());
    System.out.println("  Cache size: " + factory.size());
  }

  public static void main(String[] args) {
    run();
  }
}
