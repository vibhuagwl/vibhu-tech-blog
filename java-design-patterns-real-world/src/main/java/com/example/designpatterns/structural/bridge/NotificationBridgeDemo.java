package com.example.designpatterns.structural.bridge;

public class NotificationBridgeDemo {
    public interface Provider { String send(String channel, String message); }
    public static final class TwilioProvider implements Provider { public String send(String channel, String message) { return "Twilio " + channel + ":" + message; } }
    public static final class SnsProvider implements Provider { public String send(String channel, String message) { return "SNS " + channel + ":" + message; } }
    public abstract static class Notification {
        protected final Provider provider;
        protected Notification(Provider provider){ this.provider = provider; }
        public abstract String send(String message);
    }
    public static final class EmailNotification extends Notification {
        public EmailNotification(Provider provider){ super(provider); }
        public String send(String message){ return provider.send("EMAIL", message); }
    }
    public static final class SmsNotification extends Notification {
        public SmsNotification(Provider provider){ super(provider); }
        public String send(String message){ return provider.send("SMS", message); }
    }
}
