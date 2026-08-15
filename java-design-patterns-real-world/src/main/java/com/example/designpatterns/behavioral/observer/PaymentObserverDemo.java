package com.example.designpatterns.behavioral.observer;

import java.util.ArrayList;
import java.util.List;

/**
 * PATTERN: Observer
 *
 * WHEN TO IMPLEMENT
 * - One event must notify many independent listeners (email, ledger, analytics) without hard coupling.
 * - Subject lifecycle should not know concrete subscriber classes.
 *
 * JAVA IMPLEMENTATION RULES
 * 1. Subject keeps a list of Observer; provide subscribe/unsubscribe; notify iterates a snapshot copy.
 * 2. Observers must be fast and failure-isolated — one bad listener must not abort others (catch per listener).
 * 3. Prefer push of an event object over exposing subject internals.
 * 4. In Java, prefer explicit Observer interfaces over java.util.Observable (legacy).
 * 5. For cross-process fan-out, use messaging; in-process Observer is not a distributed bus.
 *
 * DO NOT USE WHEN
 * - There is one hard-wired collaborator — a direct call is simpler.
 */
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
