package com.vibhu.aifp.harness;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class ConversationMemory {

  private final ConcurrentHashMap<String, List<String>> store = new ConcurrentHashMap<>();

  public void append(String conversationId, String role, String content) {
    store.computeIfAbsent(conversationId, id -> new ArrayList<>()).add(role + ": " + content);
    List<String> messages = store.get(conversationId);
    if (messages.size() > 40) {
      messages.remove(0);
    }
  }

  public String summary(String conversationId) {
    List<String> messages = store.getOrDefault(conversationId, List.of());
    if (messages.isEmpty()) {
      return "";
    }
    int from = Math.max(0, messages.size() - 6);
    return String.join(" | ", messages.subList(from, messages.size()));
  }
}
