package com.example.designpatterns.behavioral.interpreter;

import java.util.List;

public class TransactionRuleInterpreterDemo {
    public record Transaction(int amount, String country) {}
    public interface Expression { boolean interpret(Transaction transaction); }
    public record AmountGreaterThan(int limit) implements Expression { public boolean interpret(Transaction t){ return t.amount() > limit; } }
    public record CountryEquals(String country) implements Expression { public boolean interpret(Transaction t){ return t.country().equals(country); } }
    public record AndExpression(Expression left, Expression right) implements Expression { public boolean interpret(Transaction t){ return left.interpret(t) && right.interpret(t); } }
    public static Expression parse(String rule) {
        List<String> tokens = List.of(rule.split(" "));
        return new AndExpression(
                new AmountGreaterThan(Integer.parseInt(tokens.get(2))),
                new CountryEquals(tokens.get(6).replace("\"", "")));
    }
}
