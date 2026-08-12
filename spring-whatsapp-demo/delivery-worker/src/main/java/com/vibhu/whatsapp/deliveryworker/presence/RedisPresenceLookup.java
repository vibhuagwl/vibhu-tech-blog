package com.vibhu.whatsapp.deliveryworker.presence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.whatsapp.common.dto.PresenceView;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@Profile("kafka | redis")
public class RedisPresenceLookup implements PresenceLookup {
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisPresenceLookup(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public PresenceView find(String userId) {
        String json = redisTemplate.opsForValue().get("presence:" + userId);
        if (json == null) {
            return new PresenceView(userId, null, null, false, null);
        }
        try {
            return objectMapper.readValue(json, PresenceView.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Unable to deserialize presence heartbeat", e);
        }
    }
}
