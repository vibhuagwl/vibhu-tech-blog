package com.vibhu.hadron.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

@Component
public class PayloadMasker {

  private static final String MASK = "***";
  private final ObjectMapper mapper;

  public PayloadMasker(ObjectMapper mapper) {
    this.mapper = mapper;
  }

  public String mask(String payload) {
    if (payload == null || payload.isBlank()) {
      return "";
    }
    try {
      JsonNode node = mapper.readTree(payload);
      if (node instanceof ObjectNode object) {
        maskField(object, "amount");
        maskField(object, "accountId");
        maskField(object, "participantId");
        return mapper.writeValueAsString(object);
      }
    } catch (Exception ignored) {
      return "[redacted-non-json payload length=" + payload.length() + "]";
    }
    return "[redacted]";
  }

  private void maskField(ObjectNode object, String field) {
    if (object.has(field)) {
      object.put(field, MASK);
    }
  }
}
