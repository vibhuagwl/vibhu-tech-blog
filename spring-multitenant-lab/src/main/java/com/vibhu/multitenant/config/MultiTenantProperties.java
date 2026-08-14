package com.vibhu.multitenant.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "multitenant")
public class MultiTenantProperties {

  private final Jwt jwt = new Jwt();
  private final Resolver resolver = new Resolver();
  private final Kafka kafka = new Kafka();
  private final Redis redis = new Redis();
  private final RateLimit rateLimit = new RateLimit();
  private final ObjectStorage objectStorage = new ObjectStorage();
  private String headerName = "X-Tenant-ID";

  public Jwt getJwt() {
    return jwt;
  }

  public Resolver getResolver() {
    return resolver;
  }

  public Kafka getKafka() {
    return kafka;
  }

  public Redis getRedis() {
    return redis;
  }

  public RateLimit getRateLimit() {
    return rateLimit;
  }

  public ObjectStorage getObjectStorage() {
    return objectStorage;
  }

  public String getHeaderName() {
    return headerName;
  }

  public void setHeaderName(String headerName) {
    this.headerName = headerName;
  }

  public static class Jwt {
    private String secret;
    private String issuer = "multitenant-lab";
    private long ttlMinutes = 60;

    public String getSecret() {
      return secret;
    }

    public void setSecret(String secret) {
      this.secret = secret;
    }

    public String getIssuer() {
      return issuer;
    }

    public void setIssuer(String issuer) {
      this.issuer = issuer;
    }

    public long getTtlMinutes() {
      return ttlMinutes;
    }

    public void setTtlMinutes(long ttlMinutes) {
      this.ttlMinutes = ttlMinutes;
    }
  }

  public static class Resolver {
    /** jwt | header | subdomain | composite */
    private String strategy = "composite";

    public String getStrategy() {
      return strategy;
    }

    public void setStrategy(String strategy) {
      this.strategy = strategy;
    }
  }

  public static class Kafka {
    private boolean enabled;
    private String bootstrapServers = "127.0.0.1:9092";
    private String topicOrders = "tenant.orders";
    private String topicDlq = "tenant.orders.dlq";

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }

    public String getBootstrapServers() {
      return bootstrapServers;
    }

    public void setBootstrapServers(String bootstrapServers) {
      this.bootstrapServers = bootstrapServers;
    }

    public String getTopicOrders() {
      return topicOrders;
    }

    public void setTopicOrders(String topicOrders) {
      this.topicOrders = topicOrders;
    }

    public String getTopicDlq() {
      return topicDlq;
    }

    public void setTopicDlq(String topicDlq) {
      this.topicDlq = topicDlq;
    }
  }

  public static class Redis {
    private boolean enabled;

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }
  }

  public static class RateLimit {
    private int defaultPerMinute = 1000;

    public int getDefaultPerMinute() {
      return defaultPerMinute;
    }

    public void setDefaultPerMinute(int defaultPerMinute) {
      this.defaultPerMinute = defaultPerMinute;
    }
  }

  public static class ObjectStorage {
    private String root = System.getProperty("java.io.tmpdir") + "/multitenant-lab-files";

    public String getRoot() {
      return root;
    }

    public void setRoot(String root) {
      this.root = root;
    }
  }
}
