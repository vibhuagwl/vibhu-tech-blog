package com.example.designpatterns.creational.singleton;

import java.util.Map;

/**
 * PATTERN: Singleton
 *
 * WHEN TO IMPLEMENT
 * - Exactly one shared instance must exist process-wide (config cache, metrics registry, ID generator).
 * - Callers must not construct duplicates that diverge under concurrency.
 *
 * JAVA IMPLEMENTATION RULES
 * 1. Prefer enum singleton or initialization-on-demand holder (Bill Pugh) — avoid public constructors.
 * 2. Keep the singleton thin: hold shared state; do not become a god object for business flows.
 * 3. Make access thread-safe by construction (enum / static final holder), not ad-hoc synchronized getters.
 * 4. Do not use double-checked locking unless you fully understand volatile + Java Memory Model.
 * 5. Prefer dependency injection of an interface in Spring apps; reserve classic Singleton for true process globals.
 *
 * DO NOT USE WHEN
 * - Per-request / per-tenant state is required, or the object is easy to inject as a Spring @Bean singleton.
 */
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
