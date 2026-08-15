package com.vibhu.hadron.config;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "hadron")
public class HadronProperties {

  private final Kafka kafka = new Kafka();
  private final Retry retry = new Retry();
  private final Dlq dlq = new Dlq();
  private final Poller poller = new Poller();
  private final Security security = new Security();

  public Kafka getKafka() {
    return kafka;
  }

  public Retry getRetry() {
    return retry;
  }

  public Dlq getDlq() {
    return dlq;
  }

  public Poller getPoller() {
    return poller;
  }

  public Security getSecurity() {
    return security;
  }

  public static class Kafka {
    private boolean enabled;
    private String bootstrapServers = "127.0.0.1:9092";
    private String groupId = "hadron-cashline-consumer";
    private int topicPartitions = 4;

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

    public String getGroupId() {
      return groupId;
    }

    public void setGroupId(String groupId) {
      this.groupId = groupId;
    }

    public int getTopicPartitions() {
      return topicPartitions;
    }

    public void setTopicPartitions(int topicPartitions) {
      this.topicPartitions = topicPartitions;
    }
  }

  public static class Retry {
    private int maxAttempts = 3;
    private List<Duration> delays =
        new ArrayList<>(
            List.of(Duration.ofMillis(200), Duration.ofMillis(400), Duration.ofMillis(800)));
    private boolean blockingInMemory;

    public int getMaxAttempts() {
      return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
      this.maxAttempts = maxAttempts;
    }

    public List<Duration> getDelays() {
      return delays;
    }

    public void setDelays(List<Duration> delays) {
      this.delays = delays;
    }

    public boolean isBlockingInMemory() {
      return blockingInMemory;
    }

    public void setBlockingInMemory(boolean blockingInMemory) {
      this.blockingInMemory = blockingInMemory;
    }
  }

  public static class Dlq {
    private int retentionDays = 90;
    private int payloadMaxBytes = 262144;

    public int getRetentionDays() {
      return retentionDays;
    }

    public void setRetentionDays(int retentionDays) {
      this.retentionDays = retentionDays;
    }

    public int getPayloadMaxBytes() {
      return payloadMaxBytes;
    }

    public void setPayloadMaxBytes(int payloadMaxBytes) {
      this.payloadMaxBytes = payloadMaxBytes;
    }
  }

  public static class Poller {
    private int batchSize = 100;
    private boolean enabled = true;

    public int getBatchSize() {
      return batchSize;
    }

    public void setBatchSize(int batchSize) {
      this.batchSize = batchSize;
    }

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }
  }

  public static class Security {
    private boolean requireReplayActor = true;
    private boolean maskPayloadInLogs = true;

    public boolean isRequireReplayActor() {
      return requireReplayActor;
    }

    public void setRequireReplayActor(boolean requireReplayActor) {
      this.requireReplayActor = requireReplayActor;
    }

    public boolean isMaskPayloadInLogs() {
      return maskPayloadInLogs;
    }

    public void setMaskPayloadInLogs(boolean maskPayloadInLogs) {
      this.maskPayloadInLogs = maskPayloadInLogs;
    }
  }
}
