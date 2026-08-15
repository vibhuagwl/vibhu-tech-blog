package com.vibhu.counter.api.service;

import com.vibhu.counter.api.idempotency.IdempotencyDecision;
import com.vibhu.counter.api.idempotency.IdempotencyStore;
import com.vibhu.counter.api.messaging.OutboxPublisher;
import com.vibhu.counter.api.store.ShardKey;
import com.vibhu.counter.api.store.ShardedCounterStore;
import com.vibhu.counter.common.dto.BatchCounterResponse;
import com.vibhu.counter.common.dto.CounterAction;
import com.vibhu.counter.common.dto.CounterValueResponse;
import com.vibhu.counter.common.dto.FlushResponse;
import com.vibhu.counter.common.dto.IncrementCounterRequest;
import com.vibhu.counter.common.dto.IncrementCounterResponse;
import com.vibhu.counter.common.dto.ShardBreakdownResponse;
import com.vibhu.counter.common.events.CounterDeltaEvent;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CounterService {
  private static final String SHARD_SUM = "SHARD_SUM";

  private final ShardedCounterStore counterStore;
  private final IdempotencyStore idempotencyStore;
  private final OutboxPublisher outboxPublisher;

  public CounterService(
      ShardedCounterStore counterStore,
      IdempotencyStore idempotencyStore,
      OutboxPublisher outboxPublisher) {
    this.counterStore = counterStore;
    this.idempotencyStore = idempotencyStore;
    this.outboxPublisher = outboxPublisher;
  }

  public IncrementCounterResponse increment(
      String resourceId, IncrementCounterRequest request, String userId, String idempotencyKey) {
    validateResourceId(resourceId);
    CounterAction action = request.action() == null ? CounterAction.VIEW : request.action();
    long delta = request.delta() == null ? 1 : request.delta();
    if (delta <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "delta must be positive");
    }

    IdempotencyDecision decision =
        idempotencyStore.reserveIfFirst(
            resourceId, action, userId, request.clientRequestId(), idempotencyKey);
    if (!decision.firstWrite()) {
      return new IncrementCounterResponse(
          resourceId,
          counterStore.sum(resourceId),
          false,
          -1,
          null,
          decision.key().orElse(null),
          SHARD_SUM);
    }

    ShardKey shardKey =
        counterStore.chooseShard(
            resourceId, stableShardHint(action, userId, request, idempotencyKey));
    counterStore.increment(shardKey, delta);

    CounterDeltaEvent event =
        new CounterDeltaEvent(
            UUID.randomUUID().toString(),
            resourceId,
            shardKey.shard(),
            delta,
            action,
            blankToNull(userId),
            firstText(idempotencyKey, request.clientRequestId()),
            Instant.now());
    outboxPublisher.publishAfterPersist(event);

    return new IncrementCounterResponse(
        resourceId,
        counterStore.sum(resourceId),
        true,
        shardKey.shard(),
        shardKey.redisKey(),
        decision.key().orElse(null),
        SHARD_SUM);
  }

  public CounterValueResponse get(String resourceId) {
    validateResourceId(resourceId);
    return new CounterValueResponse(
        resourceId, counterStore.sum(resourceId), counterStore.shardMap(resourceId), SHARD_SUM);
  }

  public BatchCounterResponse getBatch(List<String> resourceIds) {
    if (resourceIds == null || resourceIds.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "resourceIds must not be empty");
    }
    return new BatchCounterResponse(resourceIds.stream().map(this::get).toList());
  }

  public ShardBreakdownResponse shards(String resourceId) {
    validateResourceId(resourceId);
    return new ShardBreakdownResponse(
        resourceId,
        counterStore.shardValues(resourceId),
        counterStore.sum(resourceId),
        "counter:%s:shard:{i}".formatted(resourceId));
  }

  public FlushResponse flush(String resourceId) {
    validateResourceId(resourceId);
    int flushed = outboxPublisher.flush(resourceId);
    return new FlushResponse(resourceId, flushed, outboxPublisher.pendingCount(resourceId));
  }

  private static String stableShardHint(
      CounterAction action, String userId, IncrementCounterRequest request, String idempotencyKey) {
    if (action == CounterAction.VIEW) {
      return null;
    }
    return firstText(userId, idempotencyKey, request.clientRequestId());
  }

  private static String firstText(String... values) {
    for (String value : values) {
      if (value != null && !value.isBlank()) {
        return value;
      }
    }
    return null;
  }

  private static String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value;
  }

  private static void validateResourceId(String resourceId) {
    if (resourceId == null || resourceId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "resourceId must not be blank");
    }
  }
}
