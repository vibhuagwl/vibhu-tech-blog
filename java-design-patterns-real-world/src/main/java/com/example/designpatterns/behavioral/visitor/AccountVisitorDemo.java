package com.example.designpatterns.behavioral.visitor;

/**
 * PATTERN: Visitor
 *
 * <p>WHEN TO IMPLEMENT - You need many operations over a stable object structure without polluting
 * element classes. - Adding operations is frequent; adding new element types is rare.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Elements implement {@code accept(Visitor)}; Visitor declares
 * {@code visit} per concrete element type. 2. Use double dispatch: accept calls
 * visitor.visit(this). 3. Prefer generic Visitor&lt;T&gt; when visits return values. 4. Adding a
 * new element type requires updating all visitors — accept that trade-off explicitly. 5. Keep
 * visitor operations side-effect-clear; do not hide persistence inside visit methods without naming
 * it.
 *
 * <p>DO NOT USE WHEN - The type hierarchy changes often — pattern matching / sealed interfaces +
 * switch may be simpler in modern Java.
 */
public class AccountVisitorDemo {
  public interface Account {
    <T> T accept(AccountVisitor<T> visitor);
  }

  public record SavingsAccount(double balance) implements Account {
    public <T> T accept(AccountVisitor<T> visitor) {
      return visitor.visit(this);
    }
  }

  public record CurrentAccount(double balance) implements Account {
    public <T> T accept(AccountVisitor<T> visitor) {
      return visitor.visit(this);
    }
  }

  public record LoanAccount(double principal) implements Account {
    public <T> T accept(AccountVisitor<T> visitor) {
      return visitor.visit(this);
    }
  }

  public interface AccountVisitor<T> {
    T visit(SavingsAccount account);

    T visit(CurrentAccount account);

    T visit(LoanAccount account);
  }

  public static final class InterestCalculationVisitor implements AccountVisitor<Double> {
    public Double visit(SavingsAccount account) {
      return account.balance() * 0.04;
    }

    public Double visit(CurrentAccount account) {
      return account.balance() * 0.01;
    }

    public Double visit(LoanAccount account) {
      return account.principal() * 0.11;
    }
  }

  public static void run() {
    System.out.println("=== Visitor — AccountVisitorDemo ===");
    System.out.println("STEP 1: Create accounts of different types (stable structure)");
    Account savings = new SavingsAccount(10000);
    Account current = new CurrentAccount(5000);
    Account loan = new LoanAccount(20000);
    System.out.println("STEP 2: InterestCalculationVisitor applies type-specific logic");
    var visitor = new InterestCalculationVisitor();
    System.out.println("STEP 3: accept(visitor) double-dispatches to correct visit method");
    System.out.println("  Savings interest: " + savings.accept(visitor));
    System.out.println("  Current interest: " + current.accept(visitor));
    System.out.println("  Loan interest: " + loan.accept(visitor));
  }

  public static void main(String[] args) {
    run();
  }
}
