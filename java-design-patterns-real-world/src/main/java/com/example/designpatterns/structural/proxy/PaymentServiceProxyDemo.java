package com.example.designpatterns.structural.proxy;

import java.util.HashMap;
import java.util.Map;

/**
 * PATTERN: Proxy
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
}
