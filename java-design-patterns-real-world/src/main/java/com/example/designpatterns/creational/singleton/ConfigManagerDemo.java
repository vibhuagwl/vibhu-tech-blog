package com.example.designpatterns.creational.singleton;

import java.util.Map;

public class ConfigManagerDemo {
    public static String paymentTimeout() {
        return ConfigManager.getInstance().get("payment.timeout");
    }

    public static final class ConfigManager {
        private final Map<String, String> config = Map.of("payment.timeout", "30s", "fraud.threshold", "5000");
        private ConfigManager() {}
        private static class Holder { private static final ConfigManager INSTANCE = new ConfigManager(); }
        public static ConfigManager getInstance() { return Holder.INSTANCE; }
        public String get(String key) { return config.get(key); }
    }

    public enum EnumConfigManager {
        INSTANCE;
        private final Map<String, String> config = Map.of("region", "IN");
        public String get(String key) { return config.get(key); }
    }
}
