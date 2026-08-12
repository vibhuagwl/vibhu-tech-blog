package com.example.designpatterns.behavioral.observer;

import java.util.ArrayList;
import java.util.List;

public class PaymentObserverDemo {
    public record PaymentCompletedEvent(String paymentId, int amount) {}
    public interface Observer { void onPaymentCompleted(PaymentCompletedEvent event); }
    public static final class PaymentEventBus {
        private final List<Observer> observers = new ArrayList<>();
        public void register(Observer observer){ observers.add(observer); }
        public void publish(PaymentCompletedEvent event){ observers.forEach(o -> o.onPaymentCompleted(event)); }
    }
    public static final class CollectingObserver implements Observer {
        private final List<String> received = new ArrayList<>();
        private final String name;
        public CollectingObserver(String name){ this.name = name; }
        public void onPaymentCompleted(PaymentCompletedEvent event){ received.add(name + ":" + event.paymentId()); }
        public List<String> received(){ return received; }
    }
}
