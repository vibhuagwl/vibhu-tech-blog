package com.vibhu.counter.api.idempotency;

import com.vibhu.counter.common.dto.CounterAction;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class IdempotencyStore {
  private final Set<String> seenLikes = ConcurrentHashMap.newKeySet();
  private final Set<String> seenRequestKeys = ConcurrentHashMap.newKeySet();

  public IdempotencyDecision reserveIfFirst(
      String resourceId,
      CounterAction action,
      String userId,
      String clientRequestId,
      String idempotencyKey) {
    if (action != CounterAction.LIKE) {
      return new IdempotencyDecision(true, Optional.empty());
    }

    String requestKey = firstText(idempotencyKey, clientRequestId);
    if (requestKey != null) {
      String scopedRequestKey = "request:%s:%s:%s".formatted(resourceId, action, requestKey);
      if (!seenRequestKeys.add(scopedRequestKey)) {
        return new IdempotencyDecision(false, Optional.of(scopedRequestKey));
      }
      if (hasText(userId)) {
        String likeKey = "like:%s:%s".formatted(userId, resourceId);
        if (!seenLikes.add(likeKey)) {
          return new IdempotencyDecision(false, Optional.of(likeKey));
        }
      }
      return new IdempotencyDecision(true, Optional.of(scopedRequestKey));
    }

    if (hasText(userId)) {
      String likeKey = "like:%s:%s".formatted(userId, resourceId);
      if (!seenLikes.add(likeKey)) {
        return new IdempotencyDecision(false, Optional.of(likeKey));
      }
      return new IdempotencyDecision(true, Optional.of(likeKey));
    }
    return new IdempotencyDecision(true, Optional.empty());
  }

  private static String firstText(String first, String second) {
    if (hasText(first)) {
      return first;
    }
    if (hasText(second)) {
      return second;
    }
    return null;
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
