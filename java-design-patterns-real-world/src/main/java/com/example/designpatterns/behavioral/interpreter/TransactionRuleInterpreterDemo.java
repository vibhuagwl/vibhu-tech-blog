package com.example.designpatterns.behavioral.interpreter;

import java.util.List;

/**
 * PATTERN: Interpreter
 *
 * <p>WHEN TO IMPLEMENT - You have a small language/grammar (fee rules, filters) evaluated
 * in-process repeatedly. - AST of expressions beats hard-coded nested ifs for composable rules.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Define Expression interface with {@code interpret(context)}. 2.
 * Terminal vs non-terminal expressions mirror grammar productions. 3. Keep the grammar small —
 * Interpreter is not a replacement for a full parser generator for huge languages. 4. Context
 * carries variables/state; expressions should be immutable trees. 5. Validate/construct the AST in
 * a parser/factory; do not build trees ad hoc in business services.
 *
 * <p>DO NOT USE WHEN - Rules are trivial booleans, or you need a real scripting engine (use a
 * proper DSL tool).
 */
public class TransactionRuleInterpreterDemo {
  public record Transaction(int amount, String country) {}

  public interface Expression {
    boolean interpret(Transaction transaction);
  }

  public record AmountGreaterThan(int limit) implements Expression {
    public boolean interpret(Transaction t) {
      return t.amount() > limit;
    }
  }

  public record CountryEquals(String country) implements Expression {
    public boolean interpret(Transaction t) {
      return t.country().equals(country);
    }
  }

  public record AndExpression(Expression left, Expression right) implements Expression {
    public boolean interpret(Transaction t) {
      return left.interpret(t) && right.interpret(t);
    }
  }

  public static Expression parse(String rule) {
    List<String> tokens = List.of(rule.split(" "));
    return new AndExpression(
        new AmountGreaterThan(Integer.parseInt(tokens.get(2))),
        new CountryEquals(tokens.get(6).replace("\"", "")));
  }

  public static void run() {
    System.out.println("=== Interpreter — TransactionRuleInterpreterDemo ===");
    System.out.println("STEP 1: Parse rule string into expression AST");
    String rule = "amount > 1000 AND country = \"IN\"";
    Expression expression = parse(rule);
    System.out.println("  Rule: " + rule);
    System.out.println("STEP 2: Evaluate against transaction below threshold");
    var small = new Transaction(500, "IN");
    System.out.println("  amount=500, country=IN → " + expression.interpret(small));
    System.out.println("STEP 3: Evaluate against transaction matching both conditions");
    var large = new Transaction(1500, "IN");
    System.out.println("  amount=1500, country=IN → " + expression.interpret(large));
  }

  public static void main(String[] args) {
    run();
  }
}
