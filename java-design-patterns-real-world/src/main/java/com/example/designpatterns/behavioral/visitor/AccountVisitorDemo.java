package com.example.designpatterns.behavioral.visitor;

public class AccountVisitorDemo {
    public interface Account { <T> T accept(AccountVisitor<T> visitor); }
    public record SavingsAccount(double balance) implements Account { public <T> T accept(AccountVisitor<T> visitor){ return visitor.visit(this); } }
    public record CurrentAccount(double balance) implements Account { public <T> T accept(AccountVisitor<T> visitor){ return visitor.visit(this); } }
    public record LoanAccount(double principal) implements Account { public <T> T accept(AccountVisitor<T> visitor){ return visitor.visit(this); } }
    public interface AccountVisitor<T> {
        T visit(SavingsAccount account);
        T visit(CurrentAccount account);
        T visit(LoanAccount account);
    }
    public static final class InterestCalculationVisitor implements AccountVisitor<Double> {
        public Double visit(SavingsAccount account){ return account.balance() * 0.04; }
        public Double visit(CurrentAccount account){ return account.balance() * 0.01; }
        public Double visit(LoanAccount account){ return account.principal() * 0.11; }
    }
}
