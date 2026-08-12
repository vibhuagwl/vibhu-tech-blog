package com.example.designpatterns;

import com.example.designpatterns.behavioral.chainofresponsibility.PaymentValidationChainDemo;
import com.example.designpatterns.behavioral.command.PaymentCommandDemo;
import com.example.designpatterns.behavioral.observer.PaymentObserverDemo;
import com.example.designpatterns.behavioral.state.PaymentStateDemo;
import com.example.designpatterns.behavioral.strategy.PaymentStrategyDemo;
import com.example.designpatterns.creational.factory.PaymentGatewayFactoryDemo;
import com.example.designpatterns.realworld.kafka.KafkaEventFlowDemo;
import com.example.designpatterns.realworld.payment.PaymentProcessingSystem;
import com.example.designpatterns.structural.composite.OrderCompositeDemo;
import com.example.designpatterns.structural.decorator.PaymentDecoratorDemo;
import com.example.designpatterns.structural.facade.PaymentFacadeDemo;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class DesignPatternDemo {
    public static void main(String[] args) {
        System.out.println("=== JAVA DESIGN PATTERNS ===");
        System.out.println("1. Payment Factory -> " + new PaymentGatewayFactoryDemo.PaymentGatewayFactory().create(PaymentGatewayFactoryDemo.Provider.STRIPE).charge(100));
        System.out.println("2. Payment Strategy -> " + new PaymentStrategyDemo.PaymentService().pay("UPI", 500));
        List<String> audit = new ArrayList<>();
        var decorated = new PaymentDecoratorDemo.LoggingDecorator(
                new PaymentDecoratorDemo.MetricsDecorator(new PaymentDecoratorDemo.BasicPayment(), new AtomicInteger()),
                audit);
        System.out.println("3. Payment Decorator -> " + decorated.process(120));
        var auth = new PaymentValidationChainDemo.AuthenticationValidator();
        auth.linkWith(new PaymentValidationChainDemo.AmountValidator()).linkWith(new PaymentValidationChainDemo.FraudValidator());
        System.out.println("4. Payment Chain -> " + auth.validate(new PaymentValidationChainDemo.PaymentRequest("u1", 100, false, true)));
        var payment = new PaymentStateDemo.Payment(); payment.authorize(); payment.capture(); payment.settle(); payment.complete();
        System.out.println("5. Payment State -> " + payment.state());
        var bus = new PaymentObserverDemo.PaymentEventBus();
        var observer = new PaymentObserverDemo.CollectingObserver("audit"); bus.register(observer); bus.publish(new PaymentObserverDemo.PaymentCompletedEvent("pay-1", 100));
        System.out.println("6. Payment Observer -> " + observer.received());
        System.out.println("7. Payment Facade -> " + new PaymentFacadeDemo.PaymentFacade().processPayment("acct-1", 300));
        var publisher = new KafkaEventFlowDemo.InMemoryEventPublisher();
        publisher.register(event -> System.out.println("8. Kafka Notification Consumer -> " + event.paymentId()));
        publisher.publish(new KafkaEventFlowDemo.PaymentCreatedEvent("pay-2", 200));
        System.out.println("9. Banking Adapter -> " + com.example.designpatterns.realworld.banking.BankingPatternShowcase.legacySettlement());
        System.out.println("10. Order Composite -> " + new OrderCompositeDemo.Bundle().add(new OrderCompositeDemo.Product("book", 20)).add(new OrderCompositeDemo.Product("bag", 80)).total());
        var receiver = new PaymentCommandDemo.PaymentReceiver();
        var invoker = new PaymentCommandDemo.CommandInvoker(); invoker.submit(new PaymentCommandDemo.RefundPaymentCommand(receiver, "pay-3"));
        System.out.println("11. Command -> " + invoker.runNext());
        System.out.println("12. Combined Payment System -> " + new PaymentProcessingSystem.PaymentFacade().process(new PaymentProcessingSystem.PaymentRequest("cust-1", "acct-9", "CARD", 900, "STRIPE")).status());
    }
}
