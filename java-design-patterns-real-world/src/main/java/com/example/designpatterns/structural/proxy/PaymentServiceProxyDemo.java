package com.example.designpatterns.structural.proxy;

import java.util.HashMap;
import java.util.Map;

/**
 * PATTERN: Proxy
 *
 * <p>PROBLEM (without this pattern) - Status lookups hit the core payment DB on every dashboard
 * refresh. - Unauthorized callers could reach RealPaymentService without a central gate. - Caching
 * and auth would be copy-pasted into every client of fetchStatus.
 *
 * <p>HOW THIS PATTERN SOLVES IT - PaymentServiceProxy implements PaymentService like the real
 * subject. - Token check runs before delegate; cache avoids repeat fetches for same paymentId. -
 * Clients use the proxy transparently — same interface, controlled access.
 *
 * <p>WHEN TO IMPLEMENT - You need a stand-in for access control, caching, lazy init, or remote call
 * — same interface as the real subject. - Clients must not know whether they talk to local, remote,
 * or guarded implementations.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Proxy and RealSubject implement the same Subject interface. 2.
 * Proxy decides whether/when to delegate (authz, cache hit, lazy create). 3. Do not reimplement
 * core business logic in the proxy — only control access / lifecycle / I/O. 4. For virtual proxy,
 * synchronize lazy initialization carefully. 5. Distinguish Proxy (control access) from Decorator
 * (add behavior) and Adapter (convert interface).
 *
 * <p>DO NOT USE WHEN - You only need to add behavior freely — use Decorator; or interface mismatch
 * — use Adapter.
 */
public class PaymentServiceProxyDemo {
  public interface PaymentService {
    String fetchStatus(String paymentId, String token);
  }

  public static final class RealPaymentService implements PaymentService {
    public String fetchStatus(String paymentId, String token) {
      return "SETTLED:" + paymentId;
    }
  }

  public static final class PaymentServiceProxy implements PaymentService {
    private final PaymentService delegate;
    private final Map<String, String> cache = new HashMap<>();

    public PaymentServiceProxy(PaymentService delegate) {
      this.delegate = delegate;
    }

    public String fetchStatus(String paymentId, String token) {
      if (!"ALLOW".equals(token)) throw new SecurityException("unauthorized");
      return cache.computeIfAbsent(paymentId, id -> delegate.fetchStatus(id, token));
    }
  }

  public static void run() {
    System.out.println("=== Proxy — PaymentServiceProxyDemo ===");
    System.out.println(
        "PROBLEM: Every status lookup hits the real payment service with no auth gate or cache,"
            + " overloading the DB and exposing fetchStatus to unauthorized callers.");
    System.out.println(
        "SOLUTION: PaymentServiceProxy checks tokens and caches results before delegating to"
            + " RealPaymentService, controlling access without changing the client interface.");
    System.out.println("STEP 1: Wrap RealPaymentService with PaymentServiceProxy (access + cache)");
    PaymentService proxy = new PaymentServiceProxy(new RealPaymentService());
    System.out.println("STEP 2: Authorized call fetches status from delegate");
    var first = proxy.fetchStatus("pay-9001", "ALLOW");
    System.out.println("  First call: " + first);
    System.out.println("STEP 3: Second call hits proxy cache (same result, no re-fetch)");
    var second = proxy.fetchStatus("pay-9001", "ALLOW");
    System.out.println("  Cached call: " + second);
  }

  public static void main(String[] args) {
    run();
  }
}
