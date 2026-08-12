package com.example.designpatterns.creational.abstractfactory;

public class RegionalBankingFactoryDemo {
    public interface PaymentService { String pay(); }
    public interface AccountService { String account(); }
    public interface BankingFactory { PaymentService paymentService(); AccountService accountService(); }
    public static final class IndiaBankingFactory implements BankingFactory {
        public PaymentService paymentService() { return () -> "UPI payment rail"; }
        public AccountService accountService() { return () -> "India account KYC"; }
    }
    public static final class EuropeBankingFactory implements BankingFactory {
        public PaymentService paymentService() { return () -> "SEPA payment rail"; }
        public AccountService accountService() { return () -> "IBAN account rules"; }
    }
    public static final class USBankingFactory implements BankingFactory {
        public PaymentService paymentService() { return () -> "ACH payment rail"; }
        public AccountService accountService() { return () -> "US routing account rules"; }
    }
}
