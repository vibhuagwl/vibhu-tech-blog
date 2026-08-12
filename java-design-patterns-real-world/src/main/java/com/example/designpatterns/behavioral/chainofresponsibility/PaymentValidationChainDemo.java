package com.example.designpatterns.behavioral.chainofresponsibility;

public class PaymentValidationChainDemo {
    public record PaymentRequest(String userId, int amount, boolean fraudFlag, boolean accountActive) {}
    public abstract static class Validator {
        private Validator next;
        public Validator linkWith(Validator next){ this.next = next; return next; }
        public String validate(PaymentRequest request){ String result = check(request); return result.equals("OK") && next != null ? next.validate(request) : result; }
        protected abstract String check(PaymentRequest request);
    }
    public static final class AuthenticationValidator extends Validator { protected String check(PaymentRequest request){ return request.userId().isBlank() ? "AUTH_FAIL" : "OK"; } }
    public static final class AmountValidator extends Validator { protected String check(PaymentRequest request){ return request.amount() <= 0 ? "BAD_AMOUNT" : "OK"; } }
    public static final class FraudValidator extends Validator { protected String check(PaymentRequest request){ return request.fraudFlag() ? "FRAUD" : "OK"; } }
    public static final class AccountValidator extends Validator { protected String check(PaymentRequest request){ return request.accountActive() ? "OK" : "ACCOUNT_BLOCKED"; } }
}
