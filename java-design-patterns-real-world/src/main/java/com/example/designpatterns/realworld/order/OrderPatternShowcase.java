package com.example.designpatterns.realworld.order;

import com.example.designpatterns.behavioral.mediator.OrderProcessingMediatorDemo;
import com.example.designpatterns.structural.composite.OrderCompositeDemo;

public class OrderPatternShowcase {
    public static int bundledTotal() {
        return new OrderCompositeDemo.Bundle()
                .add(new OrderCompositeDemo.Product("book", 20))
                .add(new OrderCompositeDemo.Product("pen", 5))
                .total();
    }
    public static String placeOrder() { return new OrderProcessingMediatorDemo.OrderProcessingMediator().placeOrder("ORD-1"); }
}
