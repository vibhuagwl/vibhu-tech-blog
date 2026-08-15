package com.example.designpatterns;

import com.example.designpatterns.behavioral.chainofresponsibility.PaymentValidationChainDemo;
import com.example.designpatterns.behavioral.command.PaymentCommandDemo;
import com.example.designpatterns.behavioral.interpreter.TransactionRuleInterpreterDemo;
import com.example.designpatterns.behavioral.iterator.TransactionIteratorDemo;
import com.example.designpatterns.behavioral.mediator.OrderProcessingMediatorDemo;
import com.example.designpatterns.behavioral.memento.PaymentConfigurationMementoDemo;
import com.example.designpatterns.behavioral.observer.PaymentObserverDemo;
import com.example.designpatterns.behavioral.state.PaymentStateDemo;
import com.example.designpatterns.behavioral.strategy.PaymentStrategyDemo;
import com.example.designpatterns.behavioral.templatemethod.PaymentProcessingTemplateDemo;
import com.example.designpatterns.behavioral.visitor.AccountVisitorDemo;
import com.example.designpatterns.creational.abstractfactory.RegionalBankingFactoryDemo;
import com.example.designpatterns.creational.builder.PaymentTransactionBuilderDemo;
import com.example.designpatterns.creational.factory.PaymentGatewayFactoryDemo;
import com.example.designpatterns.creational.prototype.ReportConfigurationPrototypeDemo;
import com.example.designpatterns.creational.singleton.ConfigManagerDemo;
import com.example.designpatterns.realworld.kafka.KafkaEventFlowDemo;
import com.example.designpatterns.realworld.payment.PaymentProcessingSystem;
import com.example.designpatterns.structural.adapter.LegacyPaymentAdapterDemo;
import com.example.designpatterns.structural.bridge.NotificationBridgeDemo;
import com.example.designpatterns.structural.composite.OrderCompositeDemo;
import com.example.designpatterns.structural.decorator.PaymentDecoratorDemo;
import com.example.designpatterns.structural.facade.PaymentFacadeDemo;
import com.example.designpatterns.structural.flyweight.CurrencyFlyweightDemo;
import com.example.designpatterns.structural.proxy.PaymentServiceProxyDemo;

public class DesignPatternDemo {
  public static void main(String[] args) {
    System.out.println("=== JAVA DESIGN PATTERNS — ALL DEMOS ===");
    System.out.println(
        "Running 23 GoF demos plus Kafka and combined payment system in catalog order.");
    System.out.println();

    // Creational
    ConfigManagerDemo.run();
    System.out.println();
    PaymentGatewayFactoryDemo.run();
    System.out.println();
    RegionalBankingFactoryDemo.run();
    System.out.println();
    PaymentTransactionBuilderDemo.run();
    System.out.println();
    ReportConfigurationPrototypeDemo.run();
    System.out.println();

    // Structural
    LegacyPaymentAdapterDemo.run();
    System.out.println();
    NotificationBridgeDemo.run();
    System.out.println();
    OrderCompositeDemo.run();
    System.out.println();
    PaymentDecoratorDemo.run();
    System.out.println();
    PaymentFacadeDemo.run();
    System.out.println();
    CurrencyFlyweightDemo.run();
    System.out.println();
    PaymentServiceProxyDemo.run();
    System.out.println();

    // Behavioral
    PaymentValidationChainDemo.run();
    System.out.println();
    PaymentCommandDemo.run();
    System.out.println();
    TransactionRuleInterpreterDemo.run();
    System.out.println();
    TransactionIteratorDemo.run();
    System.out.println();
    OrderProcessingMediatorDemo.run();
    System.out.println();
    PaymentConfigurationMementoDemo.run();
    System.out.println();
    PaymentObserverDemo.run();
    System.out.println();
    PaymentStateDemo.run();
    System.out.println();
    PaymentStrategyDemo.run();
    System.out.println();
    PaymentProcessingTemplateDemo.run();
    System.out.println();
    AccountVisitorDemo.run();
    System.out.println();

    // Real-world
    KafkaEventFlowDemo.run();
    System.out.println();
    PaymentProcessingSystem.run();

    System.out.println();
    System.out.println("ALL DEMOS COMPLETE");
  }
}
