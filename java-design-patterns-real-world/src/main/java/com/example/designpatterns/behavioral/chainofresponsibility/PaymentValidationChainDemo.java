package com.example.designpatterns.behavioral.chainofresponsibility;

/**
 * PATTERN: Chain of Responsibility
 *
 * <p>WHEN TO IMPLEMENT - A request must pass through ordered handlers (validate → fraud → limit)
 * where each may stop or continue. - Handlers should be reorderable/extendable without editing a
 * central switchboard.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Each handler has {@code setNext} / constructor-linked successor
 * and a {@code handle} method. 2. Handler either processes + stops, or delegates to next; document
 * short-circuit rules. 3. Keep handlers focused (one validation concern); share a common
 * request/context type. 4. Build the chain in composition root / factory — business code should not
 * wire links ad hoc. 5. Always terminate the chain explicitly (end handler or null-check) to avoid
 * NPEs.
 *
 * <p>DO NOT USE WHEN - Every step must always run as a fixed pipeline with no discretionary stop —
 * Template Method or a simple list may fit better.
 */
public class PaymentValidationChainDemo {
  public record PaymentRequest(
      String userId, int amount, boolean fraudFlag, boolean accountActive) {}

  public abstract static class Validator {
    private Validator next;

    public Validator linkWith(Validator next) {
      this.next = next;
      return next;
    }

    public String validate(PaymentRequest request) {
      String result = check(request);
      return result.equals("OK") && next != null ? next.validate(request) : result;
    }

    protected abstract String check(PaymentRequest request);
  }

  public static final class AuthenticationValidator extends Validator {
    protected String check(PaymentRequest request) {
      return request.userId().isBlank() ? "AUTH_FAIL" : "OK";
    }
  }

  public static final class AmountValidator extends Validator {
    protected String check(PaymentRequest request) {
      return request.amount() <= 0 ? "BAD_AMOUNT" : "OK";
    }
  }

  public static final class FraudValidator extends Validator {
    protected String check(PaymentRequest request) {
      return request.fraudFlag() ? "FRAUD" : "OK";
    }
  }

  public static final class AccountValidator extends Validator {
    protected String check(PaymentRequest request) {
      return request.accountActive() ? "OK" : "ACCOUNT_BLOCKED";
    }
  }
}
