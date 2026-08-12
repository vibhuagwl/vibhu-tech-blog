package com.example.designpatterns.behavioral.memento;

public class PaymentConfigurationMementoDemo {
    public record Snapshot(String gateway, int timeoutSeconds) {}
    public static final class PaymentConfiguration {
        private String gateway; private int timeoutSeconds;
        public PaymentConfiguration(String gateway, int timeoutSeconds){ this.gateway = gateway; this.timeoutSeconds = timeoutSeconds; }
        public Snapshot save(){ return new Snapshot(gateway, timeoutSeconds); }
        public void restore(Snapshot snapshot){ this.gateway = snapshot.gateway(); this.timeoutSeconds = snapshot.timeoutSeconds(); }
        public String gateway(){ return gateway; }
    }
}
