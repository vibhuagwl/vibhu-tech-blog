package com.example.designpatterns.structural.bridge;

/**
 * PATTERN: Bridge
 *
 * WHEN TO IMPLEMENT
 * - Abstraction (notification type) and implementation (provider/channel) must vary independently.
 * - Avoid Cartesian explosion of subclasses (EmailTwilio, SmsTwilio, EmailSendGrid, …).
 *
 * JAVA IMPLEMENTATION RULES
 * 1. Split into Abstraction (refined notification) + Implementor (Provider interface).
 * 2. Abstraction holds a reference to Implementor (composition), never inherits from a concrete provider.
 * 3. Refined abstractions add behavior; providers only send/transport.
 * 4. Inject Implementor via constructor for testability.
 * 5. Keep Implementor API stable; extend via new providers or refined abstractions, not giant switch statements.
 *
 * DO NOT USE WHEN
 * - There is only one dimension of variation — Strategy or simple DI is enough.
 */
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
