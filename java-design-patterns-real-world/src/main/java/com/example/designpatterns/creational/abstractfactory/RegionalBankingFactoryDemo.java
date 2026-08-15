package com.example.designpatterns.creational.abstractfactory;

/**
 * PATTERN: Abstract Factory
 *
 * <p>WHEN TO IMPLEMENT - You must create families of related objects that must stay consistent (IN
 * stack vs US stack). - Mixing products across families would be invalid (wrong KYC + wrong payment
 * rail).
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Declare an abstract factory interface with one method per product
 * family member. 2. Each concrete factory returns a complete, compatible set; never mix products
 * across factories. 3. Clients depend only on abstract factory + product interfaces — zero {@code
 * new ConcreteX} in business code. 4. Prefer composition: inject AbstractFactory; do not subclass
 * clients for each region. 5. Keep product interfaces small and cohesive; do not force unrelated
 * APIs onto one factory.
 *
 * <p>DO NOT USE WHEN - Products are independent and do not form families — use Factory Method or
 * plain DI instead.
 */
public class RegionalBankingFactoryDemo {
  public interface PaymentService {
    String pay();
  }

  public interface AccountService {
    String account();
  }

  public interface BankingFactory {
    PaymentService paymentService();

    AccountService accountService();
  }

  public static final class IndiaBankingFactory implements BankingFactory {
    public PaymentService paymentService() {
      return () -> "UPI payment rail";
    }

    public AccountService accountService() {
      return () -> "India account KYC";
    }
  }

  public static final class EuropeBankingFactory implements BankingFactory {
    public PaymentService paymentService() {
      return () -> "SEPA payment rail";
    }

    public AccountService accountService() {
      return () -> "IBAN account rules";
    }
  }

  public static final class USBankingFactory implements BankingFactory {
    public PaymentService paymentService() {
      return () -> "ACH payment rail";
    }

    public AccountService accountService() {
      return () -> "US routing account rules";
    }
  }
}
