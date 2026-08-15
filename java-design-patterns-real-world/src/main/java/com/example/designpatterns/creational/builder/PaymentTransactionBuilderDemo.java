package com.example.designpatterns.creational.builder;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * PATTERN: Builder
 *
 * <p>WHEN TO IMPLEMENT - Object has many optional fields / validation rules and telescoping
 * constructors become unreadable. - You need immutable domain objects built step-by-step with
 * invariants checked at {@code build()}.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Make the product immutable (final fields); mutate only the
 * Builder until {@code build()}. 2. Validate required fields and cross-field rules inside {@code
 * build()}, not in every setter. 3. Return {@code this} from fluent setters; avoid side effects
 * beyond field assignment. 4. Prefer static nested Builder on the product class for
 * discoverability. 5. For Java records, use a compact builder or canonical constructor + withers —
 * do not expose mutable public fields.
 *
 * <p>DO NOT USE WHEN - The type has 1–3 simple fields with no optional complexity (a normal
 * constructor is clearer).
 */
public class PaymentTransactionBuilderDemo {
  public record PaymentTransaction(
      String transactionId,
      String customerId,
      BigDecimal amount,
      String currency,
      Map<String, String> metadata,
      String retryPolicy,
      boolean fraudCheck,
      String callbackUrl) {}

  public static final class Builder {
    private String transactionId;
    private String customerId;
    private BigDecimal amount;
    private String currency;
    private final Map<String, String> metadata = new HashMap<>();
    private String retryPolicy = "NONE";
    private boolean fraudCheck = true;
    private String callbackUrl = "";

    public Builder transactionId(String v) {
      transactionId = v;
      return this;
    }

    public Builder customerId(String v) {
      customerId = v;
      return this;
    }

    public Builder amount(BigDecimal v) {
      amount = v;
      return this;
    }

    public Builder currency(String v) {
      currency = v;
      return this;
    }

    public Builder metadata(String k, String v) {
      metadata.put(k, v);
      return this;
    }

    public Builder retryPolicy(String v) {
      retryPolicy = v;
      return this;
    }

    public Builder fraudCheck(boolean v) {
      fraudCheck = v;
      return this;
    }

    public Builder callbackUrl(String v) {
      callbackUrl = v;
      return this;
    }

    public PaymentTransaction build() {
      return new PaymentTransaction(
          transactionId,
          customerId,
          amount,
          currency,
          Map.copyOf(metadata),
          retryPolicy,
          fraudCheck,
          callbackUrl);
    }
  }

  public static void run() {
    System.out.println("=== Builder — PaymentTransactionBuilderDemo ===");
    System.out.println("STEP 1: Start fluent Builder for a payment transaction");
    System.out.println("STEP 2: Set required fields and optional metadata step-by-step");
    var tx =
        new Builder()
            .transactionId("tx-demo-1")
            .customerId("cust-42")
            .amount(new BigDecimal("250.00"))
            .currency("USD")
            .metadata("flow", "api")
            .retryPolicy("EXPONENTIAL")
            .build();
    System.out.println("STEP 3: build() returns immutable PaymentTransaction");
    System.out.println(
        "  id=" + tx.transactionId() + ", amount=" + tx.amount() + " " + tx.currency());
    System.out.println("  metadata=" + tx.metadata() + ", retryPolicy=" + tx.retryPolicy());
  }

  public static void main(String[] args) {
    run();
  }
}
