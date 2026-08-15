package com.example.designpatterns.structural.adapter;

/**
 * PATTERN: Adapter
 *
 * <p>WHEN TO IMPLEMENT - You must reuse an existing class/API whose interface does not match what
 * clients expect. - Integrating legacy SDK / third-party types without rewriting callers.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Target interface = what clients need; Adaptee = existing
 * incompatible API; Adapter implements Target and wraps Adaptee. 2. Translate data shapes inside
 * the adapter (cents vs amount, account vs customerId) — keep translation out of clients. 3. Prefer
 * object adapter (composition) over class adapter (multiple inheritance) in Java. 4. Do not leak
 * Adaptee types through the Target interface. 5. Handle legacy error codes by mapping to modern
 * exceptions/domain errors at the adapter boundary.
 *
 * <p>DO NOT USE WHEN - You own both sides and can change the API — fix the interface instead of
 * adapting forever.
 */
public class LegacyPaymentAdapterDemo {
  public interface ModernPaymentService {
    String pay(String customerId, int amount);
  }

  public static final class LegacyPaymentApi {
    String submitLegacy(String account, int cents) {
      return "legacy:" + account + ":" + cents;
    }
  }

  public static final class PaymentAdapter implements ModernPaymentService {
    private final LegacyPaymentApi legacy;

    public PaymentAdapter(LegacyPaymentApi legacy) {
      this.legacy = legacy;
    }

    public String pay(String customerId, int amount) {
      return legacy.submitLegacy(customerId, amount * 100);
    }
  }

  public static void run() {
    System.out.println("=== Adapter — LegacyPaymentAdapterDemo ===");
    System.out.println("STEP 1: Wrap legacy API with PaymentAdapter (object adapter)");
    var adapter = new PaymentAdapter(new LegacyPaymentApi());
    System.out.println("STEP 2: Client calls modern pay(customerId, amountInDollars)");
    System.out.println("STEP 3: Adapter translates dollars to cents for legacy submitLegacy()");
    System.out.println("  Result: " + adapter.pay("acct-1001", 10));
  }

  public static void main(String[] args) {
    run();
  }
}
