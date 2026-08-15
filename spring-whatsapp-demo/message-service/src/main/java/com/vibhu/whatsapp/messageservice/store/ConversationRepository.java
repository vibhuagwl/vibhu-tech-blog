package com.vibhu.whatsapp.messageservice.store;

import com.vibhu.whatsapp.messageservice.model.ConversationRecord;
import java.util.Comparator;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;

@Repository
public class ConversationRepository {
  private final ConcurrentMap<String, ConversationRecord> conversationsById =
      new ConcurrentHashMap<>();
  private final ConcurrentMap<String, String> directConversationIndex = new ConcurrentHashMap<>();

  public synchronized ConversationRecord createDirect(String userA, String userB) {
    String directKey = directKey(userA, userB);
    String conversationId = directConversationIndex.get(directKey);
    if (conversationId != null) {
      return conversationsById.get(conversationId);
    }

    ConversationRecord conversation =
        new ConversationRecord("conv_" + UUID.randomUUID(), Set.of(userA, userB));
    conversationsById.put(conversation.conversationId(), conversation);
    directConversationIndex.put(directKey, conversation.conversationId());
    return conversation;
  }

  public Optional<ConversationRecord> findById(String conversationId) {
    return Optional.ofNullable(conversationsById.get(conversationId));
  }

  private String directKey(String userA, String userB) {
    return Set.of(userA, userB).stream()
        .sorted(Comparator.naturalOrder())
        .collect(Collectors.joining(":"));
  }
}
