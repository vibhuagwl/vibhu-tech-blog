package com.vibhu.whatsapp.messageservice.presence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.whatsapp.common.dto.PresenceHeartbeatRequest;
import com.vibhu.whatsapp.common.dto.PresenceView;
import java.time.Duration;
import java.time.Instant;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@Profile("kafka | redis")
public class RedisPresenceStore implements PresenceStore {
  private static final Duration PRESENCE_TTL = Duration.ofSeconds(60);

  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;

  public RedisPresenceStore(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
    this.redisTemplate = redisTemplate;
    this.objectMapper = objectMapper;
  }

  @Override
  public PresenceView heartbeat(PresenceHeartbeatRequest request) {
    PresenceView presence =
        new PresenceView(
            request.userId(), request.deviceId(), request.gatewayNode(), true, Instant.now());
    try {
      redisTemplate
          .opsForValue()
          .set(key(request.userId()), objectMapper.writeValueAsString(presence), PRESENCE_TTL);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Unable to serialize presence heartbeat", e);
    }
    return presence;
  }

  @Override
  public PresenceView find(String userId) {
    String json = redisTemplate.opsForValue().get(key(userId));
    if (json == null) {
      return new PresenceView(userId, null, null, false, null);
    }
    try {
      return objectMapper.readValue(json, PresenceView.class);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Unable to deserialize presence heartbeat", e);
    }
  }

  private String key(String userId) {
    return "presence:" + userId;
  }
}
